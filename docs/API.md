# API Reference

All endpoints are prefixed with `/api`. Authentication uses JWT Bearer tokens.

**Base URL:** `http://localhost:3000/api`

---

## Authentication Module

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "securePass123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com"
  }
}
```

**Errors:**
- `409 Conflict` — Email already registered

---

### POST /auth/login
Authenticate and receive a JWT token.

**Request:**
```json
{
  "email": "alice@example.com",
  "password": "securePass123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Alice Smith",
    "email": "alice@example.com"
  }
}
```

**Errors:**
- `401 Unauthorized` — Invalid email or password

---

### GET /auth/profile
Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@example.com",
  "createdAt": "2026-07-01T10:00:00.000Z",
  "preferences": {
    "id": 1,
    "userId": 1,
    "languages": "typescript,python,sql,html",
    "minSeverity": "info",
    "styleEnabled": true,
    "bugEnabled": true,
    "securityEnabled": true,
    "performanceEnabled": true
  }
}
```

---

### PATCH /auth/profile
Update the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Alice Updated",
  "email": "alice.new@example.com"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Alice Updated",
  "email": "alice.new@example.com",
  "createdAt": "2026-07-01T10:00:00.000Z"
}
```

---

## Repositories Module

### GET /repositories
List all repositories for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query params:** `?search=myapp&sort=name&order=ASC`

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "my-awesome-app",
    "localPath": "/home/user/projects/my-app",
    "defaultBranch": "main",
    "createdAt": "2026-06-01T08:00:00.000Z",
    "updatedAt": "2026-07-01T12:00:00.000Z"
  }
]
```

### POST /repositories
Create a new repository.

**Request:**
```json
{
  "name": "my-awesome-app",
  "localPath": "/home/user/projects/my-app",
  "defaultBranch": "main"
}
```

**Response (201):**
```json
{
  "id": 1,
  "userId": 1,
  "name": "my-awesome-app",
  "localPath": "/home/user/projects/my-app",
  "defaultBranch": "main",
  "createdAt": "2026-07-01T12:00:00.000Z",
  "updatedAt": "2026-07-01T12:00:00.000Z"
}
```

### GET /repositories/:id
Get a repository by ID.

**Response (200):** Single repository object with `user` relation.

### PATCH /repositories/:id
Update a repository.

**Request:** `{ "name": "new-name", "defaultBranch": "develop" }`

### DELETE /repositories/:id
Delete a repository.

**Response (200):** `{ "deleted": true }`

### GET /repositories/:id/branches
List available branches.

**Response (200):**
```json
["main", "develop", "feature/*", "hotfix/*"]
```

### GET /repositories/:id/stats
Get repository statistics.

**Response (200):**
```json
{
  "totalPRs": 5,
  "openPRs": 2,
  "defaultBranch": "main"
}
```

---

## Pull Requests Module

### GET /repositories/:repoId/prs
List pull requests for a repository.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
[
  {
    "id": 1,
    "repositoryId": 1,
    "userId": 1,
    "title": "Add user authentication",
    "description": "Implements login/register flow",
    "baseBranch": "main",
    "sourceBranch": "feature/auth",
    "status": "open",
    "createdAt": "2026-07-01T14:00:00.000Z",
    "updatedAt": "2026-07-01T14:00:00.000Z",
    "user": { "id": 1, "name": "Alice Smith" },
    "review": { "id": 1, "status": "pending" }
  }
]
```

### POST /repositories/:repoId/prs
Create a pull request.

**Request:**
```json
{
  "title": "Add user authentication",
  "description": "Implements login/register flow",
  "baseBranch": "main",
  "sourceBranch": "feature/auth"
}
```

### GET /repositories/:repoId/prs/:id
Get a single pull request.

### PATCH /repositories/:repoId/prs/:id
Update a pull request.

### DELETE /repositories/:repoId/prs/:id
Delete a pull request.

### GET /repositories/:repoId/prs/:id/diff
Get the diff (all changed files) for a PR.

**Response (200):**
```json
[
  {
    "id": 10,
    "pullRequestId": 1,
    "filePath": "src/app.component.ts",
    "status": "modified",
    "additions": 45,
    "deletions": 12,
    "diffContent": "import { Component } from '@angular/core';..."
  }
]
```

### GET /repositories/:repoId/prs/:id/diff/files/:fileId
Get a specific file's diff.

---

## Reviews Module

### POST /prs/:prId/reviews
Start a code review for a pull request.

**Response (200):**
```json
{
  "reviewId": 1,
  "stream": {}
}
```

The review runs asynchronously. Progress is streamed via SSE.

### GET /prs/:prId/reviews
Get the review for a PR.

**Response (200):**
```json
{
  "id": 1,
  "pullRequestId": 1,
  "status": "completed",
  "styleScore": 85,
  "bugScore": 90,
  "securityScore": 70,
  "performanceScore": 95,
  "overallScore": 85,
  "executiveSummary": "Found 3 issue(s) across all categories. 1 critical, 1 major, 1 minor. Overall code quality score: 85/100.",
  "createdAt": "2026-07-01T15:00:00.000Z",
  "completedAt": "2026-07-01T15:00:05.000Z",
  "findings": [],
  "pullRequest": { "id": 1, "title": "Add user authentication" }
}
```

### GET /prs/:prId/reviews/stream
Get the current review status (for SSE polling).

**Response (200):**
```json
{
  "status": "running",
  "reviewId": 1
}
```

### GET /prs/:prId/reviews/summary
Get a summarized view of the review with per-category breakdown.

**Response (200):**
```json
{
  "reviewId": 1,
  "status": "completed",
  "overallScore": 85,
  "scores": { "style": 85, "bug": 90, "security": 70, "performance": 95 },
  "totalFindings": 3,
  "categories": {
    "style": { "total": 1, "critical": 0, "major": 0, "minor": 1, "info": 0 },
    "bug": { "total": 1, "critical": 0, "major": 1, "minor": 0, "info": 0 },
    "security": { "total": 1, "critical": 1, "major": 0, "minor": 0, "info": 0 },
    "performance": { "total": 0, "critical": 0, "major": 0, "minor": 0, "info": 0 }
  },
  "executiveSummary": "Found 3 issue(s) across all categories. 1 critical, 1 major, 1 minor. Overall code quality score: 85/100.",
  "completedAt": "2026-07-01T15:00:05.000Z"
}
```

### GET /prs/:prId/reviews/findings
Get all findings with optional filters.

**Query params:** `?severity=critical&category=security&file=src/app.ts`

**Response (200):**
```json
[
  {
    "id": 1,
    "reviewId": 1,
    "reviewFileId": 10,
    "agentName": "security",
    "ruleId": "SEC-001",
    "severity": "critical",
    "message": "Using innerHTML exposes to XSS attacks.",
    "suggestion": "Use textContent or safe DOM manipulation methods.",
    "lineStart": 15,
    "lineEnd": null,
    "column": null,
    "codeSnippet": null,
    "createdAt": "2026-07-01T15:00:03.000Z",
    "reviewFile": { "id": 10, "filePath": "src/app.component.ts" }
  }
]
```

### GET /prs/:prId/reviews/findings/:findingId
Get a single finding.

### GET /prs/:prId/reviews/findings/stats
Get aggregate statistics for findings.

**Response (200):**
```json
{
  "total": 3,
  "severity": { "critical": 1, "major": 1, "minor": 1, "info": 0 },
  "categories": { "style": 1, "bug": 1, "security": 1 }
}
```

### POST /prs/:prId/reviews/rerun
Re-run a specific agent's analysis.

**Request:**
```json
{
  "agentName": "bug"
}
```

**Response (200):** Updated review object.

---

## History Module

### GET /history
Get review history with pagination and date filtering.

**Headers:** `Authorization: Bearer <token>`

**Query params:** `?page=1&limit=20&from=2026-06-01&to=2026-07-01`

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "pullRequestId": 1,
      "status": "completed",
      "overallScore": 85,
      "executiveSummary": "...",
      "createdAt": "2026-07-01T15:00:00.000Z",
      "completedAt": "2026-07-01T15:00:05.000Z",
      "pullRequest": { "id": 1, "title": "Add user authentication" }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

### GET /history/trends
Get score trends over time.

**Response (200):**
```json
[
  {
    "date": "2026-07-01",
    "score": 85,
    "styleScore": 85,
    "bugScore": 90,
    "securityScore": 70,
    "performanceScore": 95
  }
]
```

### GET /history/reviews/:reviewId
Get detailed review with all findings and file info.

---

## Preferences Module

### GET /preferences
Get the authenticated user's preferences.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "userId": 1,
  "languages": "typescript,python,sql,html",
  "minSeverity": "info",
  "styleEnabled": true,
  "bugEnabled": true,
  "securityEnabled": true,
  "performanceEnabled": true
}
```

### PATCH /preferences
Update preferences.

**Request:**
```json
{
  "minSeverity": "major",
  "performanceEnabled": false
}
```

---

## Dashboard Module

### GET /dashboard/stats
Get overall dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "totalReviews": 10,
  "completedReviews": 8,
  "totalFindings": 45,
  "averageScore": 82,
  "totalPRs": 5,
  "openPRs": 2
}
```

### GET /dashboard/recent
Get the 5 most recent reviews.

**Response (200):**
```json
[
  {
    "id": 10,
    "pullRequestId": 5,
    "status": "completed",
    "overallScore": 92,
    "executiveSummary": "...",
    "createdAt": "2026-07-02T10:00:00.000Z",
    "pullRequest": { "id": 5, "title": "Fix performance regression" }
  }
]
```

### GET /dashboard/activity
Get recent PR activity.

**Response (200):**
```json
[
  {
    "id": 5,
    "title": "Fix performance regression",
    "status": "open",
    "reviewStatus": "completed",
    "updatedAt": "2026-07-02T10:00:00.000Z"
  }
]
```

### GET /dashboard/scores
Get average scores by category.

**Response (200):**
```json
{
  "style": 85,
  "bug": 90,
  "security": 72,
  "performance": 88
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 404,
  "message": "Review not found for this PR",
  "error": "Not Found"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (wrong user) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |
