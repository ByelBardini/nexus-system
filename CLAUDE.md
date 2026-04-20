# CLAUDE.md v4

## Planning
- Plan only when asked. No code until told to proceed.
- Interview me on non-trivial features (3+ steps) before writing code.
- Max 5 files per refactor phase. Verify, get approval, then continue.

## Code Style
- Functions: 4–20 lines. Files: under 500 lines. One responsibility each.
- Names: specific, unique. Avoid `data`, `handler`, `Manager`. Prefer names that return <5 grep hits in the codebase.
- Types: explicit. No `any`, no `Dict`, no untyped functions.
- No duplication. Extract shared logic.
- Early returns over nested ifs. Max 2 indentation levels.
- Exception messages must include the offending value and expected shape.

## Comments
- Default: no comments. Only write WHY, never WHAT.
- Don't strip existing comments on refactors — they carry intent.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers/SHAs when a line exists due to a specific bug.

## Tests
- Tests run with a single command: `npm run test`.
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O with named fake classes, not inline stubs.
- F.I.R.S.T: fast, independent, repeatable, self-validating, timely.

## Dependencies & Structure
- Inject via constructor/parameter. Never global import.
- Wrap third-party libs behind a thin project-owned interface.
- Follow NestJS/React conventions. Small focused modules over god files.
- Predictable paths: controller/service/module on backend, src/components/hooks on frontend.

## Formatting & Logging
- Use `prettier`. Don't discuss style beyond that.
- Structured JSON for debug/observability. Plain text for CLI output.

## Agent Behavior
- Re-read files before editing after 10+ messages (compaction risk).
- Files >500 LOC: read in chunks with offset/limit.
- On rename/signature change: grep for calls, types, imports, re-exports.
- Never delete a file without verifying no references exist.
- If a fix fails twice: stop, re-read the full section, state the wrong assumption.
- After correction: log the pattern to `gotchas.md`.
- "yes" / "do it" / "push" → execute. Don't restate the plan.
- Work from raw error data. If no output provided, ask for it.
