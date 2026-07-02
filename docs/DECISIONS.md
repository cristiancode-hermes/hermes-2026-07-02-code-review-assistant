# Architectural Decisions

This document captures key architectural decisions (ADRs) made during the design and development of the Code Review Assistant.

---

## ADR-001: Four Specialized Agents vs Single LLM Call

**Status:** Accepted  
**Date:** 2026-06-15

### Context
When analyzing a code diff, we need to evaluate code quality across multiple dimensions: style consistency, bug patterns, security vulnerabilities, and performance anti-patterns. The initial design considered using a single OpenAI API call with a comprehensive prompt covering all dimensions.

### Decision
Split the analysis into **four specialized agents** (Style, Bug, Security, Performance), each responsible for a single dimension and delegating to a shared analysis strategy.

### Rationale
1. **Separation of concerns**: Each agent has a single responsibility, making them independently testable and maintainable.
2. **Parallel execution**: Agents can run concurrently (though currently sequential for simplicity), reducing total review time.
3. **Granular scoring**: Per-category scores (styleScore, bugScore, etc.) enable users to see exactly where their code needs improvement.
4. **Partial results**: If one agent fails (e.g., API timeout), the other three still produce results.
5. **Scoring isolation**: Each agent applies severity weights independently, preventing one category's issues from dominating the overall score.
6. **Future extensibility**: New agents (accessibility, documentation, i18n) can be added without changing existing ones.

### Consequences
- Positive: Cleaner code, easier debugging, better user feedback
- Positive: Each agent can use a different strategy (local heuristics for bug detection, OpenAI for style suggestions)
- Negative: Slightly more boilerplate (4 agent classes instead of 1 service)
- Negative: Sequential iteration over 4 agents × N files means total review time scales linearly

---

## ADR-002: LocalHeuristicStrategy as Default over Pure OpenAI

**Status:** Accepted  
**Date:** 2026-06-15

### Context
The system needs to work out-of-the-box without requiring users to configure an OpenAI API key. It must also function offline and provide consistent, deterministic results.

### Decision
Default to `LocalHeuristicStrategy` (regex-based pattern matching) with `OpenAIStrategy` as an opt-in replacement. The coordinator auto-detects whether an API key is configured and selects the appropriate strategy.

### Rationale
1. **Zero-config onboarding**: First-time users can run reviews immediately.
2. **Deterministic results**: Local heuristics always produce the same output for the same input — important for CI/CD pipelines.
3. **Offline capability**: No network dependency means reviews work in air-gapped environments.
4. **Cost**: No API costs for the default path.
5. **Speed**: Regex matching is nearly instant; LLM calls take seconds.
6. **Coexistence**: The strategy pattern allows per-agent strategy selection in the future (e.g., local heuristic for style, OpenAI for security).

### Consequences
- Positive: Accessible to all users regardless of API key availability
- Positive: Faster review cycle for the default path
- Negative: Local heuristics are less nuanced than LLM analysis (false positives/negatives)
- Negative: The heuristic rules must be maintained and extended as new patterns emerge
- Negative: OpenAI path currently returns empty findings (requires implementation)

---

## ADR-003: Object-Syntax Relations in TypeORM

**Status:** Accepted  
**Date:** 2026-06-15

### Context
TypeORM supports two syntaxes for specifying relations in queries: string array (`['user', 'preferences']`) and object syntax (`{ user: true, preferences: true }`).

### Decision
Use **object-syntax consistently** throughout the codebase.

### Rationale
1. **Type safety**: TypeScript validates that relation names match actual entity property names.
2. **Nested relations**: Object syntax cleanly supports `{ findings: { reviewFile: true } }` without string concatenation.
3. **IDE support**: Autocompletion works naturally with object properties.
4. **Consistency**: Mixing both syntaxes in the same codebase is confusing.

### Consequences
- Positive: Compiler catches misspelled relation names
- Positive: Cleaner, more readable query definitions
- Neutral: Requires TypeORM 0.3+ (project uses latest)

---

## ADR-004: sql.js over better-sqlite3

**Status:** Accepted  
**Date:** 2026-06-15

### Context
The project needs a SQLite-compatible database that works without external database servers. Two popular SQLite packages for Node.js are `better-sqlite3` (native C++ addon) and `sql.js` (JavaScript compiled via Emscripten).

### Decision
Use **sql.js** (via TypeORM's `sqljs` driver type).

### Rationale
1. **Zero native compilation**: sql.js is pure JavaScript — no node-gyp, no platform-specific binaries, no build failures.
2. **Works everywhere**: Same install works on Windows, macOS, Linux, ARM, and even in browser environments.
3. **Simple deployment**: No need to rebuild native modules on deployment.
4. **Sufficient performance**: For a development/demo tool with small datasets, sql.js is fast enough.
5. **Neon/PostgreSQL upgrade path**: The TypeORM abstraction makes swapping to PostgreSQL trivial by changing the driver type and connection string.

### Consequences
- Positive: No build toolchain requirements for the database layer
- Positive: Consistent install experience across all platforms
- Negative: Slower than better-sqlite3 for large datasets (>10K rows)
- Negative: In-memory by default (though supports file-based via `location` option)
- Negative: SQLite features like WAL mode and FTS5 are not available through sql.js

---

## ADR-005: SSE (Server-Sent Events) for Agent Progress Streaming

**Status:** Accepted  
**Date:** 2026-06-15

### Context
The review process runs asynchronously and can take several seconds. The frontend needs real-time updates on each agent's progress without polling.

### Decision
Use **Server-Sent Events (SSE)** via RxJS `Subject`/`Observable` to stream agent progress from the backend to the frontend.

### Rationale
1. **Unidirectional data flow**: Progress events flow from server to client — no need for client-to-server messages (which would require WebSocket).
2. **Built-in browser support**: `EventSource` API is native in all modern browsers; no additional libraries needed.
3. **RxJS integration**: NestJS supports returning RxJS Observables from controllers, which map naturally to SSE.
4. **Simpler than WebSocket**: No bidirectional protocol overhead, no reconnection logic to implement manually.
5. **HTTP-native**: Works through standard HTTP proxies and load balancers.

### Consequences
- Positive: Clean frontend integration with Angular's SSE support
- Positive: Automatic reconnection built into the EventSource API
- Negative: Only supports text data (no binary frames)
- Negative: Limited to 6 concurrent connections per browser (HTTP/1.1 limitation)
- Negative: The fire-and-forget pattern in `runReview()` means `runAsyncReview()` must handle all errors internally and emit them through the subject

---

## ADR-006: Fire-and-Forget Async Review Pattern

**Status:** Accepted  
**Date:** 2026-06-15

### Context
The `runReview` endpoint needs to return immediately while the analysis runs in the background. The client needs a stream to track progress.

### Decision
The `runReview()` method calls `runAsyncReview()` without `await`, returning the review ID and an Observable immediately. The async method updates the database and emits progress events through the shared Subject.

### Rationale
1. **Immediate HTTP response**: The endpoint does not block while analysis runs.
2. **SSE compatibility**: The Observable returned from `runReview()` is subscribed to by the controller's SSE endpoint, giving the client real-time updates.
3. **Resource cleanup**: Even if the HTTP connection drops, the review continues in the background.

### Consequences
- Positive: No request timeout issues for long-running reviews
- Positive: Client can show a live progress UI
- Positive: Multiple users can trigger reviews without blocking the server
- Negative: Errors in `runAsyncReview` must be caught and emitted — they won't propagate to the HTTP response
- Negative: Testing is more complex (need to flush microtasks or use integration tests)
