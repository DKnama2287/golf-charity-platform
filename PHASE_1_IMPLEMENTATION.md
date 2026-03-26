# Phase 1: Critical Scalability Implementation Plan

## Overview
Phase 1 focused on unblocking scale: **Pagination, Mobile Auth, Rate Limiting**

---

## 1. PAGINATION IMPLEMENTATION

### Files to Update

#### A. `/src/app/api/v1/admin/users/route.ts`
```typescript
// Add at top
import { z } from 'zod';

const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().default('-createdAt')
});

// Update GET handler
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validation = PaginationSchema.parse(Object.fromEntries(searchParams));

  const skip = (validation.page - 1) * validation.limit;
  const total = await UserModel.countDocuments();

  const users = await UserModel.find()
    .sort(validation.sort)
    .skip(skip)
    .limit(validation.limit)
    .lean();

  return successResponse({
    data: users,
    pagination: {
      page: validation.page,
      limit: validation.limit,
      total,
      pages: Math.ceil(total / validation.limit),
      hasMore: skip + validation.limit < total
    }
  });
}
```

#### B. `/src/app/api/v1/admin/winnings/route.ts`
```typescript
// Similar pagination implementation
```

#### C. `/src/app/api/v1/admin/verifications/route.ts`
```typescript
// Similar pagination implementation
```

#### D. `/src/app/api/v1/charities/route.ts`
```typescript
// Add filtering + pagination
const filter: Record<string, any> = {};
if (search) filter.name = { $regex: search, $options: 'i' };
if (category) filter.category = category;
if (featured) filter.featured = featured === 'true';

const charities = await CharityModel.find(filter)
  .sort(validation.sort)
  .skip(skip)
  .limit(validation.limit)
  .lean();
```

---

## 2. MOBILE AUTHENTICATION

### New File: `/src/lib/auth/mobile.ts`
```typescript
export async function authenticateRequest(request: Request) {
  // 1. Try Authorization header (mobile/API)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      return await verifySessionToken(authHeader.slice(7));
    } catch (error) {
      return null;
    }
  }

  // 2. Try HTTPOnly cookie (web)
  try {
    const token = await getAccessTokenFromCookies(request);
    if (token) {
      return await verifySessionToken(token);
    }
  } catch (error) {
    return null;
  }

  return null;
}

export async function createTokenPair(payload: SessionPayload) {
  const accessToken = await createSessionToken(payload);
  const refreshToken = await createRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    tokenType: 'Bearer'
  };
}
```

### Update: `/src/app/api/v1/auth/login/route.ts`
```typescript
export async function POST(request: Request) {
  const { email, password } = await request.json();

  // ... existing validation ...

  const tokens = await createTokenPair({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.fullName
  });

  // Set HTTPOnly cookie for web
  const response = new Response(
    JSON.stringify({ success: true, data: tokens }),
    { status: 200 }
  );

  response.cookies.set({
    name: 'accessToken',
    value: tokens.accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: tokens.expiresIn
  });

  response.cookies.set({
    name: 'refreshToken',
    value: tokens.refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  });

  return response;
}
```

### New Route: `/src/app/api/v1/auth/refresh/route.ts`
```typescript
export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return errorResponse('Refresh token required', 400);
    }

    const payload = await verifyRefreshToken(refreshToken);

    const newTokenPair = await createTokenPair({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name
    });

    return successResponse({
      accessToken: newTokenPair.accessToken,
      refreshToken: newTokenPair.refreshToken,
      expiresIn: newTokenPair.expiresIn,
      tokenType: 'Bearer'
    });

  } catch (error) {
    return errorResponse('Invalid refresh token', 401);
  }
}
```

---

## 3. RATE LIMITING

### New File: `/src/lib/middleware/rate-limit.ts`
```typescript
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  windowMs: number;  // 15 minutes
  maxRequests: number; // 100 requests
}

interface RequestMetrics {
  count: number;
  resetTime: number;
}

const cache = new LRUCache<string, RequestMetrics>({
  max: 10000,
  ttl: 15 * 60 * 1000 // 15 minutes
});

export async function rateLimitMiddleware(
  request: Request,
  config: RateLimitConfig = { windowMs: 15 * 60 * 1000, maxRequests: 100 }
) {
  const clientIp =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-client-ip') ||
    'unknown';

  const metrics = cache.get(clientIp) || {
    count: 0,
    resetTime: Date.now() + config.windowMs
  };

  const now = Date.now();

  // Reset if window expired
  if (now > metrics.resetTime) {
    metrics.count = 0;
    metrics.resetTime = now + config.windowMs;
  }

  metrics.count++;
  cache.set(clientIp, metrics);

  const response = new Response(null, { status: 200 });
  response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, config.maxRequests - metrics.count)));
  response.headers.set('X-RateLimit-Reset', String(metrics.resetTime));

  if (metrics.count > config.maxRequests) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((metrics.resetTime - now) / 1000)),
        ...Object.fromEntries(response.headers)
      }
    });
  }

  return null; // Request allowed
}
```

### Update: `/src/app/api/v1/admin/route.ts` (Example)
```typescript
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';

export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitError = await rateLimitMiddleware(request, {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100
  });

  if (rateLimitError) {
    return rateLimitError;
  }

  // ... rest of handler ...
}
```

---

## 4. ADMIN ENDPOINT FILTERING

### Update: `/src/app/api/v1/admin/users/route.ts`
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Pagination
  const validation = PaginationSchema.parse(Object.fromEntries(searchParams));
  const skip = (validation.page - 1) * validation.limit;

  // Filtering
  const filter: Record<string, any> = {};

  if (searchParams.get('search')) {
    filter.$or = [
      { email: { $regex: searchParams.get('search'), $options: 'i' } },
      { fullName: { $regex: searchParams.get('search'), $options: 'i' } }
    ];
  }

  if (searchParams.get('subscriptionStatus')) {
    filter['subscription.status'] = searchParams.get('subscriptionStatus');
  }

  if (searchParams.get('subscriptionPlan')) {
    filter['subscription.plan'] = searchParams.get('subscriptionPlan');
  }

  if (searchParams.get('role')) {
    filter.role = searchParams.get('role');
  }

  const total = await UserModel.countDocuments(filter);
  const users = await UserModel.find(filter)
    .sort(validation.sort)
    .skip(skip)
    .limit(validation.limit)
    .lean();

  return successResponse({
    data: users,
    pagination: {
      page: validation.page,
      limit: validation.limit,
      total,
      pages: Math.ceil(total / validation.limit)
    }
  });
}
```

---

## 5. TYPE DEFINITIONS FOR PAGINATION

### Update: `/src/lib/types.ts`
```typescript
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}
```

---

## Implementation Checklist

### Week 1
- [ ] Create pagination schema and utility
- [ ] Update 5 critical list endpoints (users, winnings, verifications, charities, draws)
- [ ] Create mobile auth functions
- [ ] Update login endpoint with token pair
- [ ] Create refresh token endpoint
- [ ] Create rate limiting middleware
- [ ] Update response types

### Week 2
- [ ] Test pagination with 10,000+ records
- [ ] Test mobile auth flow
- [ ] Test rate limiting under load
- [ ] Add filtering to admin endpoints
- [ ] Update API documentation
- [ ] Create mobile SDK integration guide
- [ ] Load test API endpoints

### Testing Checklist
- [ ] Pagination loads correctly at scale
- [ ] Mobile auth without cookies works
- [ ] Refresh token extends session
- [ ] Rate limiting blocks at threshold
- [ ] Error messages clear for clients
- [ ] Performance benchmarks met

---

## Estimated Effort: 40-60 hours

**Critical for starting:** Pagination + Mobile Auth (must do)
**Nice to have:** Full filtering, advanced rate limiting (can iterate)
