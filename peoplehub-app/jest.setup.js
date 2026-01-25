// @ai:ag - Created by Antigravity
// Jest setup file

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for Node test runtime
// @ts-expect-error -- Node polyfill
global.TextEncoder = TextEncoder;
// @ts-expect-error -- Node polyfill
global.TextDecoder = TextDecoder;

// Only mock browser APIs if running in jsdom environment
if (typeof window !== 'undefined') {
    // Mock window.matchMedia for useMediaQuery tests
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // deprecated
            removeListener: jest.fn(), // deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });

    // Mock localStorage for useLocalStorage tests
    const localStorageMock = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
    });

    // Mock IntersectionObserver
    class IntersectionObserverMock {
        observe = jest.fn();
        unobserve = jest.fn();
        disconnect = jest.fn();
    }
    Object.defineProperty(window, 'IntersectionObserver', {
        writable: true,
        value: IntersectionObserverMock,
    });

    // Mock ResizeObserver
    class ResizeObserverMock {
        observe = jest.fn();
        unobserve = jest.fn();
        disconnect = jest.fn();
    }
    Object.defineProperty(window, 'ResizeObserver', {
        writable: true,
        value: ResizeObserverMock,
    });
}

// Suppress console errors during tests (optional)
// console.error = jest.fn();

