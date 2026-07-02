# AI Integration — Multi-Agent Architecture

The Code Review Assistant uses a **multi-agent architecture** where four specialized AI agents analyze code diffs across different quality dimensions. This document details how the agents work, how the Strategy Pattern enables flexible analysis, and how scores are calculated.

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Rung 2: Agent Layer"
        CO[AgentCoordinatorService]
    end
    
    subgraph "Rung 3: Agent Specialization"
        SA[StyleAgent]
        BA[BugAgent]
        SEA[SecurityAgent]
        PA[PerformanceAgent]
    end
    
    subgraph "Strategy Pattern (Rung 3b)"
        LH[LocalHeuristicStrategy<br/>Regex Rules]
        OAI[OpenAIStrategy<br/>LLM-Powered]
    end
    
    subgraph "Output"
        F[(Finding[] persisted)]
        SC[Score Calculation]
        SUM[Executive Summary]
    end
    
    CO --> SA
    CO --> BA
    CO --> SEA
    CO --> PA
    
    SA --> LH
    SA --> OAI
    BA --> LH
    BA --> OAI
    SEA --> LH
    SEA --> OAI
    PA --> LH
    PA --> OAI
    
    LH --> F
    OAI --> F
    F --> SC
    F --> SUM
```

### Multi-Agent Hierarchy (Rung 2 → 3)

This is a **Rung 2–3** multi-agent system (terminology from the AI agent stack):

- **Rung 2 (Orchestrator)**: `AgentCoordinatorService` manages the review lifecycle, iterates over agents, collects findings, and calculates scores.
- **Rung 3 (Specialized Agents)**: Four single-purpose agents filter strategy output by their category.

---

## The Strategy Pattern

Each agent receives a `CodeAnalysisStrategy` via dependency injection. This allows the analysis backend to be swapped without modifying the agent classes.

### CodeAnalysisStrategy Interface

```typescript
export interface CodeAnalysisStrategy {
  name: string;
  analyze(fileText: string, filePath: string, context: any): Promise<Finding[]>;
}
```

Two implementations exist:

| Strategy | Name | How It Works | When Used |
|----------|------|-------------|-----------|
| `LocalHeuristicStrategy` | `local-heuristic` | Regex pattern matching across 20+ rules | Default: no API key configured |
| `OpenAIStrategy` | `openai` | Placeholder for LLM-powered analysis | When `OPENAI_API_KEY` is set |

### Strategy Selection

The `AgentCoordinatorService` constructor checks for an API key:

```typescript
const apiKey = this.configService.get<string>('OPENAI_API_KEY');
if (apiKey && !apiKey.startsWith('sk-you')) {
  this.strategy = this.openAIStrategy;
} else {
  this.strategy = this.localHeuristic;
}
```

The `sk-you` check treats `sk-you...onal` (the .env.example default) as "not configured."

---

## The Four Agents

### 1. StyleAgent
- **Category**: `style`
- **Scope**: Code formatting, naming conventions, code organization
- **Heuristic rules**: 
  - STYLE-001: Function too long (>50 lines) → `major`
  - STYLE-002: Inconsistent naming (camelCase vs snake_case) → `minor`
  - STYLE-003: Missing semicolons → `minor`
  - STYLE-004: TODO/FIXME/HACK comments → `info`
  - STYLE-005: Large import statements (>10 items) → `minor`

### 2. BugAgent
- **Category**: `bug`
- **Scope**: Logic errors, type coercion, variable scoping issues
- **Heuristic rules**:
  - BUG-001: Loose equality (`==` vs `===`) → `major`
  - BUG-002: `var` declaration → `major`
  - BUG-003: `parseInt()` without radix → `major`
  - BUG-004: `null` comparison without `undefined` → `minor`

### 3. SecurityAgent
- **Category**: `security`
- **Scope**: XSS, injection, credential leakage, path traversal
- **Heuristic rules**:
  - SEC-001: `innerHTML` assignment → `critical`
  - SEC-002: `eval()` usage → `critical`
  - SEC-003: `document.write()` → `critical`
  - SEC-004: Hardcoded credentials / API keys → `critical`
  - SEC-005: SQL injection (string concatenation) → `critical`
  - SEC-006: Path traversal (`../` in file ops) → `major`

### 4. PerformanceAgent
- **Category**: `performance`
- **Scope**: DOM thrashing, loop efficiency, data structure choices
- **Heuristic rules**:
  - PERF-001: Style manipulation inside loops → `major`
  - PERF-002: `innerHTML` inside loops → `major`
  - PERF-003: `.filter().map()` chaining → `minor`
  - PERF-004: Nested loops (O(n²) complexity) → `major`
  - PERF-005: Plain object as Map → `minor`

---

## LocalHeuristicStrategy Pattern Matching

The heuristic strategy uses regex-based pattern matching across all four categories in a single pass through the file lines.

### Detection Approach

```
For each line in file:
  1. Check style patterns
  2. Check bug patterns  
  3. Check security patterns
  4. Check performance patterns
  5. Collect findings into array
```

Key characteristics:
- **Stateless per-call**: Each `analyze()` call is independent
- **Line-by-line scanning**: O(n) where n = number of lines
- **Deterministic**: Same input always produces same output
- **No external dependencies**: Works entirely offline

### Example: How STYLE-001 Detects Long Functions

```
for each line:
  if detect function start (function|def|...{):
    start counting brace depth
  if (brace closed) and (line count - start > 50):
    report STYLE-001 finding
```

---

## Scoring Formula

Each category starts at **100** and deducts points based on finding severity:

| Severity | Weight | Description |
|----------|--------|-------------|
| `critical` | 10 | Security vulnerabilities, data loss risks |
| `major` | 5 | Likely bugs, significant anti-patterns |
| `minor` | 2 | Style issues, minor improvements |
| `info` | 1 | Suggestions, cosmetic improvements |

### Calculation Steps

```
1. Per-agent:
   deduction = Σ severityWeights[findings.severity]
   categoryScore = max(0, 100 - deduction)

2. Overall score:
   overallScore = round((styleScore + bugScore + securityScore + performanceScore) / 4)

3. Executive summary:
   - Count findings by severity
   - Format narrative summary
   - Include overall score
```

### Example Calculation

Given 1 critical finding (weight 10) in security:
- styleScore = 100 (no findings)
- bugScore = 100 (no findings)
- securityScore = max(0, 100 - 10) = 90
- performanceScore = 100 (no findings)
- overallScore = round((100 + 100 + 90 + 100) / 4) = 98

---

## Future AI Enhancement Path

The strategy pattern enables a clear upgrade path:

1. **Phase 1** (current): `LocalHeuristicStrategy` — regex rules, instant, offline
2. **Phase 2**: `OpenAIStrategy` — LLM-powered analysis for nuanced findings
3. **Phase 3**: Per-agent strategy selection — e.g., local heuristic for style, OpenAI for security
4. **Phase 4**: Custom strategy plugins — user-defined rules uploaded via API
5. **Phase 5**: Learning strategy — agent improves from user feedback (upvotes/downvotes on findings)
