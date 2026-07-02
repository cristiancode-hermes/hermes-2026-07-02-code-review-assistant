# Learnings

This document captures key technical and architectural insights gained during the development of the Code Review Assistant.

---

## 1. The Strategy Pattern Makes Agent Testing Trivial

Injecting a `CodeAnalysisStrategy` into each agent was one of the best architectural decisions. It enables:

- **Unit testing agents in isolation**: Mock the strategy, verify the agent filters correctly by category
- **Testing strategies independently**: Test `LocalHeuristicStrategy` with raw code snippets — no NestJS module needed
- **Swapping at runtime**: The coordinator picks the strategy based on config without changing agent code

```typescript
// Agent test — no strategy needed
const mockStrategy = { analyze: jest.fn() };
const agent = new StyleAgent(mockStrategy);
mockStrategy.analyze.mockResolvedValue(mockFindings);
const result = await agent.analyze(code, path, context);
expect(result.every(f => f.category === 'style')).toBe(true);
```

## 2. Fire-and-Forget Async Requires Careful Error Handling

The decision to run reviews asynchronously (without `await` in `runReview()`) solved the request-blocking problem but introduced a subtle challenge: errors in `runAsyncReview()` don't propagate to the HTTP response. Every `await` in the async path must be wrapped in try/catch, and errors must be:

1. Logged (via `Logger`)
2. Emitted through the progress Subject (so the client knows)
3. Persisted to the database (so the review status reflects failure)

**Lesson learned**: Always add a top-level try/catch in fire-and-forget async methods. Missing one causes silent failures.

## 3. Jest Type Resolution with ts-jest Needs Explicit Configuration

Getting Jest to work with TypeScript required more setup than expected:

- **`tsconfig.spec.json`**: The main tsconfig doesn't include `@types/jest`, so tests fail with "Cannot find name 'describe'." A separate spec tsconfig that extends the main one and adds `"types": ["jest", "node"]` is essential.
- **Module resolution**: NestJS's path aliases (`@/*`) need `moduleNameMapper` in jest config.
- **Mock placement**: `jest.mock()` calls must be at the top of the file, before any imports, or the mock won't take effect.

## 4. SQLite Type Inconsistencies Across Drivers

TypeORM's `sqljs` driver has subtle type differences from `better-sqlite3`:

- **`datetime` type**: In `sql.js`, this maps to a number (Unix timestamp), while in PostgreSQL it's a proper timestamp. Entity definitions use `{ type: 'datetime' }` which works for both but serializes differently.
- **Boolean columns**: `sql.js` stores booleans as 0/1 integers; TypeORM handles the conversion but raw queries see numbers.
- **Auto-increment**: `sql.js` requires explicit `@PrimaryGeneratedColumn()` with integer type; no `increment: true` option needed.

**Lesson**: Test entity behavior with your target database driver early. What works in sql.js may need adjustment for PostgreSQL.

## 5. The Heuristic Strategy Has Inherent Limitations

The `LocalHeuristicStrategy` uses regex patterns that are fast but imprecise:

- **False positives**: `innerHTML =` in a comment is still flagged because line trimming doesn't always catch comment prefixes.
- **False negatives**: `parseInt(value)` should be flagged without radix, but a bug in the detection logic (`!line.includes('parseInt(')`) makes this rule unreachable (see ADR-001 notes).
- **Language-specific gaps**: The style checks work well for JavaScript/TypeScript but don't understand Python indentation or Go's brace style.
- **Context-blind**: A 51-line function might be perfectly fine (e.g., a switch statement), but the heuristic always flags it.

**Lesson**: Heuristic rules are great for a 90% solution. Document the known gaps and provide a clear upgrade path to LLM-based analysis.

## 6. Object-Syntax Relations Are Type-Safe but Verbose

TypeORM's object-syntax (`{ relations: { user: true, preferences: true } }`) provides excellent type safety — the compiler catches misspelled relation names — but it's verbose compared to string arrays (`['user', 'preferences']`).

```
// Object syntax (2 levels):
{ relations: { findings: { reviewFile: true }, pullRequest: { repository: true } } }

// String syntax (2 levels):
['findings.reviewFile', 'pullRequest.repository']
```

For deep nesting (3+ levels), object syntax becomes unwieldy. Consider using TypeORM's `FindOptionsRelations` type for complex queries.

## 7. SSE + RxJS Subjects Require Careful Lifecycle Management

The `Subject<AgentProgress>` pattern for SSE streaming works well but has pitfalls:

- **Memory leaks**: Every SSE connection creates a subscription to the Subject. If the client disconnects, the subscription must be cleaned up.
- **Multiple calls**: Triggering `runReview()` twice for the same PR creates two Subjects. The second call should return the existing stream.
- **Completion**: The Subject must be `.complete()`d in all exit paths (success, error, empty files) or the SSE connection hangs indefinitely.
- **Serialization**: RxJS Subjects can only emit serializable data. All progress events must be JSON-safe.

**Current code**: The coordinator always creates a new Subject. A future improvement would cache active review streams.

## 8. Mock Repository Pattern Simplifies NestJS Testing

Using a centralized mock repository pattern dramatically simplified test setup:

```typescript
const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};
```

Benefits:
- **Consistency**: Every service test uses the same mock shape
- **Flexibility**: Override specific methods per test case with `mockResolvedValueOnce`
- **Verification**: Easy to assert `toHaveBeenCalledWith` on any method
- **Isolation**: No TypeORM initialization needed in unit tests

The key trick: register mocks via `{ provide: getRepositoryToken(Entity), useValue: mockRepo }` in the TestingModule, and all `@InjectRepository()` injections work seamlessly.

## 9. Testing Fire-and-Forget Async Code Requires Microtask Flushing

The `runAsyncReview()` method is called without `await`, making its execution asynchronous relative to the test. Simply calling `await service.runReview(prId)` doesn't wait for the agents to run.

Solution: flush the Node.js microtask queue after the call:

```typescript
await service.runReview(prId);
await new Promise(resolve => setTimeout(resolve, 50));
// Now agent calls and DB operations have completed
```

This works because all mock operations resolve as Promises (microtasks), and `setTimeout` gives the event loop a chance to process them. Without this pattern, tests for the coordinator would need significant restructuring.

## 10. Module Isolation Prevents Circular Dependencies

NestJS's modular design initially tempted us to create cross-module imports (e.g., `ReviewsModule` importing `PullRequestsModule`). This led to circular dependency warnings.

**Solution**: Each module owns its TypeORM entity registrations. Cross-module queries go through service classes, not direct repository access. The `AgentsModule` is the only module that `ReviewsModule` depends on, enforced by the `exports: [AgentCoordinatorService]` declaration.

```
AppModule
 ├── AuthModule (self-contained)
 ├── RepositoriesModule
 ├── PullRequestsModule (depends on RepositoriesModule)
 ├── ReviewsModule (depends on AgentsModule)
 ├── AgentsModule (self-contained)
 ├── HistoryModule
 ├── PreferencesModule
 └── DashboardModule
```
