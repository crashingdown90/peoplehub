/**
 * API Client for PeopleHub
 * Centralized API calls with error handling, caching, and offline support
 */
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

// ==========================================
// CSRF-AWARE FETCH UTILITY
// ==========================================

let _csrfToken: string | null = null;
const _CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

async function _fetchCsrfToken(): Promise<string> {
    const res = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch CSRF token");
    const data = await res.json();
    const token: string = data.token;
    _csrfToken = token;
    return token;
}

async function _ensureCsrfToken(): Promise<string> {
    if (_csrfToken) return _csrfToken;
    return _fetchCsrfToken();
}

/**
 * Drop-in replacement for fetch() with automatic CSRF token handling.
 * - Adds x-csrf-token header for POST/PUT/PATCH/DELETE requests
 * - Auto-refreshes token and retries on 403 CSRF errors
 */
export async function fetchWithCsrf(
    url: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const options: RequestInit = { ...init, credentials: init?.credentials || "include" };
    const method = (options.method || "GET").toUpperCase();

    if (_CSRF_METHODS.includes(method)) {
        const token = await _ensureCsrfToken();
        const existingHeaders = options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : (options.headers as Record<string, string>) || {};
        options.headers = { ...existingHeaders, [CSRF_HEADER_NAME]: token };
    }

    const response = await fetch(url, options);

    // On CSRF 403, refresh token and retry once
    if (response.status === 403 && _CSRF_METHODS.includes(method)) {
        const body = await response.clone().json().catch(() => null);
        if (body?.error?.code === "CSRF_VALIDATION_FAILED" || body?.error?.code === "CSRF_ERROR") {
            _csrfToken = null;
            const newToken = await _fetchCsrfToken();
            const retryHeaders = options.headers instanceof Headers
                ? Object.fromEntries(options.headers.entries())
                : (options.headers as Record<string, string>) || {};
            options.headers = { ...retryHeaders, [CSRF_HEADER_NAME]: newToken };
            return fetch(url, options);
        }
    }

    return response;
}

// ==========================================
// LEGACY API CLIENT CLASS
// ==========================================

interface APIConfig {
    baseURL: string;
    timeout: number;
    retries: number;
}

interface RequestOptions extends RequestInit {
    cache?: RequestCache;
    timeout?: number;
    retry?: boolean;
}

class APIClient {
    private config: APIConfig;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private pendingRequests: Map<string, Promise<any>>;

    constructor(config: Partial<APIConfig> = {}) {
        this.config = {
            baseURL: process.env.NEXT_PUBLIC_API_URL || '',
            timeout: 30000,
            retries: 3,
            ...config,
        };
        this.pendingRequests = new Map();
    }

    /**
     * Make an API request with retry and offline support
     */
    private async request<T>(
        endpoint: string,
        options: RequestOptions = {}
    ): Promise<T> {
        const url = `${this.config.baseURL}${endpoint}`;
        const requestKey = `${options.method || 'GET'}-${url}`;

        // Deduplicate identical pending requests
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }

        const requestPromise = this.executeRequest<T>(url, options);
        this.pendingRequests.set(requestKey, requestPromise);

        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.pendingRequests.delete(requestKey);
        }
    }

    private async executeRequest<T>(
        url: string,
        options: RequestOptions
    ): Promise<T> {
        const {
            timeout = this.config.timeout,
            retry = true,
            ...fetchOptions
        } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...fetchOptions.headers,
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new APIError(error.message || 'Request failed', response.status, error);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            // Handle offline scenario
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                // Try to get from cache
                const cachedData = await this.getCachedResponse<T>(url);
                if (cachedData) {
                    return cachedData;
                }

                // Queue for later if it's a mutation
                if (fetchOptions.method && fetchOptions.method !== 'GET') {
                    await this.queueOfflineRequest(url, fetchOptions);
                }

                throw new APIError('No internet connection', 0, { offline: true });
            }

            // Retry logic
            if (retry && options.method === 'GET') {
                return this.retryRequest<T>(url, options);
            }

            throw error;
        }
    }

    private async retryRequest<T>(
        url: string,
        options: RequestOptions,
        attempt: number = 1
    ): Promise<T> {
        if (attempt > this.config.retries) {
            throw new APIError('Max retries exceeded', 0);
        }

        // Exponential backoff
        await new Promise((resolve) =>
            setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000))
        );

        return this.executeRequest<T>(url, { ...options, retry: false });
    }

    private async getCachedResponse<T>(url: string): Promise<T | null> {
        if (typeof caches === 'undefined') return null;

        try {
            const cache = await caches.open('peoplehub-api');
            const response = await cache.match(url);

            if (response) {
                return response.json();
            }
        } catch (error) {
            console.error('Cache read error:', error);
        }

        return null;
    }

    private async queueOfflineRequest(url: string, options: RequestInit) {
        // Store in IndexedDB for background sync
        if ('indexedDB' in window) {
            try {
                const db = await this.openOfflineDB();
                const transaction = db.transaction(['pendingRequests'], 'readwrite');
                const store = transaction.objectStore('pendingRequests');

                await store.add({
                    url,
                    options,
                    timestamp: Date.now(),
                });

                // Register background sync if available
                if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
                    const registration = await navigator.serviceWorker.ready;
                    // Background Sync API type - not yet in standard TypeScript definitions
                    const syncManager = (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync;
                    await syncManager.register('sync-data');
                }
            } catch (error) {
                console.error('Failed to queue offline request:', error);
            }
        }
    }

    private async openOfflineDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PeopleHubOffline', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('pendingRequests')) {
                    db.createObjectStore('pendingRequests', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    // Public API methods
    public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    public post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    public put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    public patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

// Custom error class
export class APIError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export type for custom instances
export type { APIClient };
