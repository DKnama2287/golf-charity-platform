# Golf Charity Subscription Platform REST API Design

Base path:

```text
/api/v1
```

## Auth

### Signup

- Endpoint: `POST /api/v1/auth/signup`
- Auth required: No

Request body:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123!",
  "charityId": "uuid",
  "contributionPercent": 15
}
```

Response:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "fullName": "John Doe",
      "role": "user"
    },
    "accessToken": "jwt-token"
  }
}
```

### Login

- Endpoint: `POST /api/v1/auth/login`
- Auth required: No

Request body:

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123!"
}
```

Response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "jwt-token"
  }
}
```

### Current User

- Endpoint: `GET /api/v1/auth/me`
- Auth required: Yes

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

## Subscription

### Create Subscription

- Endpoint: `POST /api/v1/subscriptions`
- Auth required: Yes

Request body:

```json
{
  "plan": "monthly"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/...",
    "subscriptionReference": "sub_ref_123"
  }
}
```

### Get Subscription Status

- Endpoint: `GET /api/v1/subscriptions/status`
- Auth required: Yes

Response:

```json
{
  "success": true,
  "data": {
    "plan": "monthly",
    "status": "active",
    "currentPeriodStart": "2026-03-01T00:00:00Z",
    "currentPeriodEnd": "2026-04-01T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

### Cancel Subscription

- Endpoint: `POST /api/v1/subscriptions/cancel`
- Auth required: Yes

Request body:

```json
{
  "cancelAtPeriodEnd": true
}
```

Response:

```json
{
  "success": true,
  "message": "Subscription cancellation updated",
  "data": {
    "status": "active",
    "cancelAtPeriodEnd": true
  }
}
```

### Stripe Webhook

- Endpoint: `POST /api/v1/subscriptions/webhook`
- Auth required: No

Request body:
- Raw Stripe payload

Response:

```json
{
  "received": true
}
```

## Scores

### Add Score

- Endpoint: `POST /api/v1/scores`
- Auth required: Yes

Request body:

```json
{
  "score": 34,
  "playedAt": "2026-03-20"
}
```

Response:

```json
{
  "success": true,
  "message": "Score added successfully",
  "data": {
    "scoreId": "uuid",
    "last5Scores": [
      {
        "id": "uuid",
        "score": 34,
        "playedAt": "2026-03-20"
      }
    ]
  }
}
```

### Edit Score

- Endpoint: `PUT /api/v1/scores/:scoreId`
- Auth required: Yes

Request body:

```json
{
  "score": 36,
  "playedAt": "2026-03-20"
}
```

Response:

```json
{
  "success": true,
  "message": "Score updated successfully",
  "data": {
    "id": "uuid",
    "score": 36,
    "playedAt": "2026-03-20"
  }
}
```

### Get Last 5 Scores

- Endpoint: `GET /api/v1/scores`
- Auth required: Yes

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "score": 35,
      "playedAt": "2026-03-22"
    }
  ]
}
```

## Draw System

### Simulate Draw

- Endpoint: `POST /api/v1/draws/simulate`
- Auth required: Yes, Admin

Request body:

```json
{
  "drawMonth": "2026-03-01",
  "mode": "algorithm"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "drawId": "uuid",
    "mode": "algorithm",
    "generatedNumbers": [28, 31, 34, 35, 38],
    "activeSubscriberCount": 240,
    "prizePoolAmount": 4800,
    "projectedWinners": {
      "match3": 12,
      "match4": 2,
      "match5": 0
    }
  }
}
```

### Run Draw

- Endpoint: `POST /api/v1/draws/run`
- Auth required: Yes, Admin

Request body:

```json
{
  "drawMonth": "2026-03-01",
  "mode": "random"
}
```

Response:

```json
{
  "success": true,
  "message": "Draw executed successfully",
  "data": {
    "drawId": "uuid",
    "generatedNumbers": [12, 17, 26, 33, 41],
    "status": "simulated"
  }
}
```

### Publish Results

- Endpoint: `POST /api/v1/draws/:drawId/publish`
- Auth required: Yes, Admin

Response:

```json
{
  "success": true,
  "message": "Draw results published",
  "data": {
    "drawId": "uuid",
    "status": "published",
    "publishedAt": "2026-03-24T10:00:00Z"
  }
}
```

## Charity Selection

### Get Charities

- Endpoint: `GET /api/v1/charities`
- Auth required: No

### Select Charity

- Endpoint: `POST /api/v1/user-charity-selection`
- Auth required: Yes

Request body:

```json
{
  "charityId": "uuid",
  "contributionPercent": 20
}
```

Response:

```json
{
  "success": true,
  "message": "Charity selection updated",
  "data": {
    "charityId": "uuid",
    "contributionPercent": 20
  }
}
```

## Winnings and Verification

### Get My Winnings

- Endpoint: `GET /api/v1/winnings`
- Auth required: Yes

### Submit Winner Verification

- Endpoint: `POST /api/v1/winnings/:winningId/verification`
- Auth required: Yes

Request body:

```json
{
  "proofFileUrl": "https://storage.supabase.co/...",
  "notes": "Score screenshot attached"
}
```

Response:

```json
{
  "success": true,
  "message": "Verification submitted successfully",
  "data": {
    "verificationId": "uuid",
    "status": "pending"
  }
}
```

## Admin Controls

### Get Users

- Endpoint: `GET /api/v1/admin/users`
- Auth required: Yes, Admin

### Edit User Score

- Endpoint: `PUT /api/v1/admin/users/:userId/scores/:scoreId`
- Auth required: Yes, Admin

### Create Charity

- Endpoint: `POST /api/v1/admin/charities`
- Auth required: Yes, Admin

### Review Winner Verification

- Endpoint: `PATCH /api/v1/admin/verifications/:verificationId`
- Auth required: Yes, Admin

### Mark Winning Paid

- Endpoint: `POST /api/v1/admin/winnings/:winningId/pay`
- Auth required: Yes, Admin

### Reports Summary

- Endpoint: `GET /api/v1/admin/reports/summary`
- Auth required: Yes, Admin

## Suggested Backend Layering

```text
src/
├─ app/
│  └─ api/
│     └─ v1/
│        ├─ auth/
│        ├─ subscriptions/
│        ├─ scores/
│        ├─ draws/
│        ├─ charities/
│        ├─ user-charity-selection/
│        ├─ winnings/
│        └─ admin/
├─ lib/
│  ├─ controllers/
│  │  ├─ auth.controller.ts
│  │  ├─ subscription.controller.ts
│  │  ├─ score.controller.ts
│  │  ├─ draw.controller.ts
│  │  ├─ charity.controller.ts
│  │  ├─ winnings.controller.ts
│  │  └─ admin.controller.ts
│  ├─ services/
│  │  ├─ auth.service.ts
│  │  ├─ subscription.service.ts
│  │  ├─ stripe.service.ts
│  │  ├─ score.service.ts
│  │  ├─ draw.service.ts
│  │  ├─ prize-pool.service.ts
│  │  ├─ charity.service.ts
│  │  ├─ winnings.service.ts
│  │  ├─ verification.service.ts
│  │  └─ report.service.ts
│  ├─ repositories/
│  ├─ validations/
│  ├─ db/
│  └─ utils/
```
