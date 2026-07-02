# System Architecture

## Overview

The Hermes Code Review Assistant follows a **layered monolith** architecture with a clear separation between the Angular frontend, NestJS backend, AI agent subsystem, and data persistence layer. The design prioritizes offline capability, extensibility, and real-time user feedback.

## High-Level Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        ANG[Angular 22 SPA<br/>Zoneless / Signals]
        TAIL[Tailwind CSS v4]
    end

    subgraph "API Layer (NestJS)"
        GW[Global Prefix: /api]
        VAL[ValidationPipe<br/>class-validator]
        FLT[HttpExceptionFilter]
        SWG[Swagger /api/docs]
        
        subgraph "Auth Module"
            REG[POST /auth/register]
            LOG[POST /auth/login]
            PRO[GET /auth/profile]
            JWT[JwtStrategy + Guard]
        end
        
        subgraph "Core Modules"
            REPO[Repositories Module]
            PR[Pull Requests Module]
            RV[Reviews Module]
            AGT[Agents Module]
            DASH[Dashboard Module]
            HIST[History Module]
            PREF[Preferences Module]
        end
    end

    subgraph "Agent Subsystem"
        COORD[AgentCoordinatorService]
        STYLE[Style Agent<br/>→ style findings]
        BUG[Bug Agent<br/>→ bug findings]
        SEC[Security Agent<br/>→ security findings]
        PERF[Performance Agent<br/>→ perf findings]
        
        subgraph "Strategy Pattern"
            LOCAL[LocalHeuristicStrategy<br/>Regex-based rules]
            AI[OpenAIStrategy<br/>LLM-powered analysis]
        end
        
        RXJS[RxJS Subject<br/>SSE Progress Stream]
    end

    subgraph "Data Layer"
        ORM[TypeORM]
        DB[(SQL.js / SQLite<br/>Neon PostgreSQL)]
        ENT[7 Entities<br/>User, Repository, PR,<br/>Review, ReviewFile,<br/>Finding, UserPreference]
    end

    ANG -- HTTP/JSON --> GW
    GW --> VAL --> FLT
    REG --> JWT
    LOG --> JWT
    PRO --> JWT
    
    RV --> COORD
    COORD --> STYLE
    COORD --> BUG
    COORD --> SEC
    COORD --> PERF
    
    STYLE --> LOCAL
    STYLE --> AI
    BUG --> LOCAL
    BUG --> AI
    SEC --> LOCAL
    SEC --> AI
    PERF --> LOCAL
    PERF --> AI
    
    COORD --> RXJS
    ANG -- SSE --> RXJS
    
    COORD --> ORM --> ENT --> DB
    REPO --> ORM
    PR --> ORM
    DASH --> ORM
    HIST --> ORM
    PREF --> ORM
```

## Data Flow

### PR Review Flow

```
1. User creates a Pull Request (POST /api/repositories/:id/prs)
2. User triggers review (POST /api/prs/:id/reviews)
3. ReviewsService.runReview() calls AgentCoordinatorService.runReview()
4. Coordinator fetches ReviewFile records for the PR
5. For each file, runs ALL 4 agents sequentially:
   a. Emits "running" status via RxJS Subject (SSE stream)
   b. Agent calls its strategy's analyze(fileText, filePath, context)
   c. Strategy returns Finding[] interface objects
   d. Findings persisted to Finding entity via TypeORM
   e. Emits "completed" status with findingsCount
6. After all agents complete:
   a. Score calculated per category (100 - severity deductions)
   b. Overall score = average of 4 category scores
   c. Executive summary generated
   d. Review record updated with scores and summary
   e. "system/completed" event emitted
7. Frontend displays findings categorized by agent type
```

### Authentication Flow

```
1. User registers (POST /api/auth/register)
2. Password hashed with bcryptjs (salt rounds: 10)
3. User record created in DB
4. Default UserPreference record created
5. JWT token signed (7-day expiry) with sub, email, name
6. Token returned to client
7. Subsequent requests include Bearer token
8. JwtStrategy extracts user info from token
9. @UseGuards(JwtAuthGuard) protects endpoints
```

## Key Architectural Decisions

### Why NestJS?
- **Modular architecture** with dependency injection fits the multi-agent design
- **Decorator-based routing** keeps controllers clean
- **RxJS integration** enables natural SSE streaming
- **TypeORM integration** abstracts database differences

### Why Strategy Pattern for Agents?
Each agent (Style, Bug, Security, Performance) is a lightweight filter that delegates to a `CodeAnalysisStrategy`. This enables:
- **Local-first**: `LocalHeuristicStrategy` uses regex rules, works offline
- **AI-powered**: `OpenAIStrategy` can be swapped in when API key is configured
- **Extensible**: New strategies can be added without changing agents

### Why Fire-and-Forget for Async Review?
The `runAsyncReview` method runs without being awaited in `runReview()`:
- **Immediate response**: Returns reviewId + Observable immediately
- **SSE streaming**: Client subscribes to progress events via Server-Sent Events
- **No request timeout**: Long-running reviews don't block HTTP connections

## Module Dependency Graph

```mermaid
graph LR
    APP[AppModule] --> AUTH[AuthModule]
    APP --> REPO[RepositoriesModule]
    APP --> PR[PullRequestsModule]
    APP --> RV[ReviewsModule]
    APP --> AGT[AgentsModule]
    APP --> HIST[HistoryModule]
    APP --> PREF[PreferencesModule]
    APP --> DASH[DashboardModule]
    
    RV --> AGT
    PR --> REPO
    HIST --> RV
    DASH --> RV
```

The `AppModule` imports all feature modules and configures the database connection. Feature modules are largely independent except `ReviewsModule` which depends on `AgentsModule` for the coordinator service.
