# CSRF Protection - Usage Guide

> **For:** Frontend Team | **Date:** 23 Januari 2026

## Overview

CSRF (Cross-Site Request Forgery) protection telah diimplementasi untuk PeopleHub. Dokumentasi ini menjelaskan cara menggunakan CSRF protection di forms dan API calls.

---

## Quick Start

### 1. Import Hook

```typescript
import { useCsrf } from '@/hooks/useCsrf';
```

### 2. Use in Component

```typescript
const { token, getHeaders } = useCsrf();

const handleSubmit = async (data) => {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(), // Add CSRF header
    },
    body: JSON.stringify(data),
  });
};
```

---

## Examples

### Example 1: Login Form

```typescript
'use client';

import { useState } from 'react';
import { useCsrf } from '@/hooks/useCsrf';
import { Button, Input } from '@/components/ui';

export function LoginForm() {
  const { getHeaders, loading: csrfLoading } = useCsrf();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getHeaders(), // CSRF protection
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        window.location.href = '/dashboard';
      } else {
        alert(data.error.message);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <Input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        placeholder="Password"
        required
      />
      <Button 
        type="submit" 
        disabled={loading || csrfLoading}
      >
        {loading ? 'Loading...' : 'Login'}
      </Button>
    </form>
  );
}
```

### Example 2: Leave Request Form

```typescript
'use client';

import { useCsrf } from '@/hooks/useCsrf';
import { useState } from 'react';

export function LeaveRequestForm() {
  const { getHeaders } = useCsrf();
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/leave/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(), // CSRF protection
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Pengajuan cuti berhasil dikirim');
      // Reset form or redirect
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Example 3: File Upload with CSRF

```typescript
'use client';

import { useCsrf } from '@/hooks/useCsrf';

export function FileUploadForm() {
  const { getHeaders } = useCsrf();

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        ...getHeaders(), // CSRF protection
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData,
    });

    const result = await response.json();
    console.log('Upload result:', result);
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
    />
  );
}
```

### Example 4: Custom Fetch Hook with CSRF

```typescript
// hooks/useApiClient.ts
import { useCsrf } from './useCsrf';
import { useCallback } from 'react';

export function useApiClient() {
  const { getHeaders } = useCsrf();

  const post = useCallback(async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }, [getHeaders]);

  const put = useCallback(async (url: string, data: any) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(),
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }, [getHeaders]);

  const del = useCallback(async (url: string) => {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return response.json();
  }, [getHeaders]);

  return { post, put, delete: del };
}

// Usage in component:
export function MyComponent() {
  const api = useApiClient();

  const handleDelete = async (id: string) => {
    const result = await api.delete(`/api/items/${id}`);
    console.log(result);
  };

  return <button onClick={() => handleDelete('123')}>Delete</button>;
}
```

---

## Server-Side Validation

### API Route Example

```typescript
// app/api/some-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf, getCsrfErrorResponse } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfValidation = await validateCsrf(request.headers);
  
  if (!csrfValidation.valid) {
    return NextResponse.json(
      getCsrfErrorResponse(),
      { status: 403 }
    );
  }

  // Process request
  const body = await request.json();
  
  // Your logic here
  
  return NextResponse.json({ success: true });
}
```

---

## Hook API Reference

### `useCsrf(options?)`

**Options:**
- `autoFetch?: boolean` - Auto-fetch token on mount (default: `true`)

**Returns:**
```typescript
{
  token: string | null;        // Current CSRF token
  loading: boolean;            // Loading state
  error: Error | null;         // Error if token fetch failed
  refreshToken: () => Promise<void>; // Manually refresh token
  getHeaders: () => Record<string, string>; // Get headers object
}
```

**Example with manual fetch:**
```typescript
const { token, refreshToken, getHeaders } = useCsrf({ autoFetch: false });

useEffect(() => {
  refreshToken(); // Fetch when needed
}, [refreshToken]);
```

---

## Best Practices

### ✅ DO

1. **Always use CSRF for mutations:**
   ```typescript
   // POST, PUT, DELETE requests
   fetch('/api/endpoint', {
     method: 'POST',
     headers: { ...getHeaders() },
     body: JSON.stringify(data),
   });
   ```

2. **Use the hook at component level:**
   ```typescript
   function MyForm() {
     const { getHeaders } = useCsrf();
     // Use in form submit
   }
   ```

3. **Handle loading states:**
   ```typescript
   const { getHeaders, loading } = useCsrf();
   
   <Button disabled={loading}>
     Submit
   </Button>
   ```

### ❌ DON'T

1. **Don't skip CSRF for public forms:**
   ```typescript
   // WRONG: No CSRF protection
   fetch('/api/contact', {
     method: 'POST',
     body: JSON.stringify(data),
   });
   
   // RIGHT: Always include CSRF
   fetch('/api/contact', {
     method: 'POST',
     headers: { ...getHeaders() },
     body: JSON.stringify(data),
   });
   ```

2. **Don't manually set CSRF header:**
   ```typescript
   // WRONG
   headers: {
     'x-csrf-token': 'hardcoded-token'
   }
   
   // RIGHT
   headers: {
     ...getHeaders()
   }
   ```

---

## Testing CSRF Protection

```typescript
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './LoginForm';

// Mock useCsrf hook
jest.mock('@/hooks/useCsrf', () => ({
  useCsrf: () => ({
    getHeaders: () => ({ 'x-csrf-token': 'test-token' }),
    loading: false,
  }),
}));

test('form submits with CSRF token', async () => {
  const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
    json: async () => ({ success: true }),
  } as Response);

  render(<LoginForm />);
  
  fireEvent.click(screen.getByText('Login'));

  expect(mockFetch).toHaveBeenCalledWith(
    '/api/auth/login',
    expect.objectContaining({
      headers: expect.objectContaining({
        'x-csrf-token': 'test-token',
      }),
    })
  );
});
```

---

## Troubleshooting

### Token not included in request

**Problem:** CSRF token tidak terkirim dalam request.

**Solution:**
```typescript
// Make sure to spread getHeaders()
headers: {
  'Content-Type': 'application/json',
  ...getHeaders(), // Must use spread operator
}
```

### 403 CSRF validation failed

**Problem:** Server menolak request dengan error CSRF.

**Possible causes:**
1. Cookie tidak terkirim (check `credentials: 'include'`)
2. Token expired (auto-refresh after 1 hour)
3. Token mismatch

**Solution:**
```typescript
// Include credentials
fetch('/api/endpoint', {
  method: 'POST',
  credentials: 'include', // Important for cookies
  headers: { ...getHeaders() },
  body: JSON.stringify(data),
});
```

---

## Migration Checklist

- [ ] Install CSRF in login forms
- [ ] Install CSRF in register forms  
- [ ] Install CSRF in data modification forms
- [ ] Install CSRF in file upload forms
- [ ] Install CSRF in admin operations
- [ ] Test all forms after integration
- [ ] Update form tests to mock `useCsrf`

---

## Support

If you encounter issues, check:
1. [CSRF Implementation](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/lib/security/csrf.ts)
2. [useCsrf Hook](file:///Users/drefan/Projects/PeopleHub/peoplehub-app/src/hooks/useCsrf.ts)
3. [Security Audit Report](file:///Users/drefan/Projects/PeopleHub/docs/08-testing/reports/security-audit-2026-01-23.md)

**Contact:** Application Security Engineer
