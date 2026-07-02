# Database Schema

## Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Repository : "has many"
    User ||--o{ PullRequest : "creates"
    User ||--o| UserPreference : "has one"
    Repository ||--o{ PullRequest : "contains"
    PullRequest ||--o| Review : "has one"
    PullRequest ||--o{ ReviewFile : "contains"
    Review ||--o{ Finding : "has many"
    ReviewFile ||--o{ Finding : "has many"
```

## Entities

### User
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | Display name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| passwordHash | VARCHAR(255) | NOT NULL | bcrypt hash |
| createdAt | DATETIME | NOT NULL, default now | Account creation timestamp |

**Relations:**
- `OneToMany` → Repository (user.repositories)
- `OneToMany` → UserPreference (user.preferences)

### UserPreference
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| userId | INTEGER | UNIQUE, FK → User.id | Owner |
| languages | VARCHAR(200) | default 'typescript,python,sql,html' | Languages to analyze |
| minSeverity | VARCHAR(20) | default 'info' | Minimum severity to report |
| styleEnabled | BOOLEAN | default true | Style agent toggle |
| bugEnabled | BOOLEAN | default true | Bug agent toggle |
| securityEnabled | BOOLEAN | default true | Security agent toggle |
| performanceEnabled | BOOLEAN | default true | Performance agent toggle |

### Repository
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| userId | INTEGER | FK → User.id | Owner |
| name | VARCHAR(200) | NOT NULL | Repository name |
| localPath | VARCHAR(1000) | NOT NULL | Filesystem path |
| defaultBranch | VARCHAR(100) | default 'main' | Default git branch |
| createdAt | DATETIME | NOT NULL | Created timestamp |
| updatedAt | DATETIME | NOT NULL | Updated timestamp |

**Relations:**
- `ManyToOne` → User
- `OneToMany` → PullRequest

### PullRequest
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| repositoryId | INTEGER | FK → Repository.id | Parent repository |
| userId | INTEGER | FK → User.id | Creator |
| title | VARCHAR(300) | NOT NULL | PR title |
| description | TEXT | nullable | PR description |
| baseBranch | VARCHAR(100) | NOT NULL | Target branch |
| sourceBranch | VARCHAR(100) | NOT NULL | Source branch |
| status | VARCHAR(20) | default 'open' | open/closed/merged |
| createdAt | DATETIME | NOT NULL | Created timestamp |
| updatedAt | DATETIME | NOT NULL | Updated timestamp |

**Relations:**
- `ManyToOne` → User
- `ManyToOne` → Repository
- `OneToOne` → Review
- `OneToMany` → ReviewFile

### Review
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| pullRequestId | INTEGER | FK → PullRequest.id | Related PR |
| status | VARCHAR(20) | default 'pending' | pending/running/completed/failed |
| styleScore | INTEGER | nullable | Style category score (0-100) |
| bugScore | INTEGER | nullable | Bug category score (0-100) |
| securityScore | INTEGER | nullable | Security category score (0-100) |
| performanceScore | INTEGER | nullable | Performance category score (0-100) |
| overallScore | INTEGER | nullable | Average of all category scores |
| executiveSummary | TEXT | nullable | Generated summary text |
| createdAt | DATETIME | NOT NULL | Created timestamp |
| completedAt | DATETIME | nullable | Completion timestamp |

**Relations:**
- `OneToOne` → PullRequest (via pullRequestId + JoinColumn)
- `OneToMany` → Finding

### ReviewFile
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| pullRequestId | INTEGER | FK → PullRequest.id | Related PR |
| filePath | VARCHAR(1000) | NOT NULL | File path in repo |
| status | VARCHAR(20) | NOT NULL | added/modified/deleted |
| additions | INTEGER | default 0 | Lines added |
| deletions | INTEGER | default 0 | Lines deleted |
| diffContent | TEXT | nullable | File diff content |

**Unique constraint:** (pullRequestId, filePath)

**Relations:**
- `ManyToOne` → PullRequest
- `OneToMany` → Finding

### Finding
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, Auto-increment | Unique identifier |
| reviewId | INTEGER | FK → Review.id | Related review |
| reviewFileId | INTEGER | FK → ReviewFile.id | Related file |
| agentName | VARCHAR(20) | NOT NULL | style/bug/security/performance |
| ruleId | VARCHAR(100) | nullable | e.g. STYLE-001, BUG-002 |
| severity | VARCHAR(20) | NOT NULL | critical/major/minor/info |
| message | TEXT | NOT NULL | Human-readable description |
| suggestion | TEXT | nullable | Fix recommendation |
| lineStart | INTEGER | NOT NULL | Starting line number |
| lineEnd | INTEGER | nullable | Ending line number |
| column | INTEGER | nullable | Column position |
| codeSnippet | TEXT | nullable | Relevant code extract |
| createdAt | DATETIME | NOT NULL | Created timestamp |

**Relations:**
- `ManyToOne` → Review
- `ManyToOne` → ReviewFile

## Key Design Decisions

### Object-Syntax Relations
All TypeORM relations use **object-syntax** (`{ relations: { user: true } }`) instead of string arrays (`['user']`). This provides:
- **Type safety**: The compiler validates relation names
- **Nested relations**: Clean syntax for `{ findings: { reviewFile: true } }`
- **IDE autocompletion**: Relation names are discoverable

### Why sql.js over better-sqlite3?
- **Zero native compilation**: sql.js is pure JavaScript (via Emscripten), works everywhere
- **Web compatibility**: Can theoretically run in browser environments
- **Simpler deployment**: No platform-specific binaries needed
- **Trade-off**: Slightly slower than better-sqlite3 for large datasets

## Migration Strategy

The app uses TypeORM's `synchronize: true` for development, which auto-creates tables from entity definitions. For production, use migrations:

```bash
# Generate migration from entity changes
npx typeorm migration:generate -n MigrationName

# Run pending migrations
npx typeorm migration:run
```

### Neon / PostgreSQL Compatibility

The schema is designed to be PostgreSQL-compatible. To switch:

1. Install `pg` and `@nestjs/typeorm` driver
2. Update `DATABASE_URL` to `postgresql://user:password@host/db`
3. Change TypeORM config in `app.module.ts`:
   ```typescript
   type: 'postgres' as const,
   url: config.get('DATABASE_URL'),
   ssl: { rejectUnauthorized: false },  // Neon requirement
   ```
4. Remove `sql.js` dependency
5. Note: `datetime` type maps to `timestamp` in PostgreSQL

## Seed Data

The `SeedService` (in `src/seed/seed.service.ts`) provides demo data. It creates:
- A demo user with sample repository
- Pull requests with review files containing realistic code diffs
- Optional: pre-run reviews with sample findings

Run seeding via:
```bash
# If implemented as a CLI command
npx ts-node src/seed/seed.ts

# Or via API endpoint (if exposed)
curl -X POST http://localhost:3000/api/seed
```
