---
description: Comprehensive code review for TypeScript, JavaScript, Python. Analyzes code quality, security, best practices, and generates review reports. Use when reviewing pull requests, providing code feedback, or ensuring code quality standards.
---

# Code Reviewer

Comprehensive toolkit for code review with modern tools and best practices.

## When to Use

- Reviewing pull requests or code changes
- Auditing code for quality issues
- Identifying security vulnerabilities
- Enforcing coding standards
- Generating structured review reports

---

## Code Review Checklist

### Correctness & Logic
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled (null, empty arrays, 0, negative numbers)
- [ ] Error handling is correct and complete
- [ ] No off-by-one errors in loops/indices
- [ ] Async/await used correctly, no race conditions

### Security
- [ ] No sensitive data exposed (passwords, tokens, keys) in code or logs
- [ ] Inputs are validated at system boundaries
- [ ] SQL injection not possible (parameterized queries)
- [ ] XSS prevented (outputs escaped/sanitized)
- [ ] Authorization checks present for protected operations
- [ ] Dependencies are up-to-date (no known vulnerabilities)

### Performance
- [ ] No N+1 query problems
- [ ] No unnecessary re-renders (React)
- [ ] No expensive operations in render/hot paths
- [ ] Database queries use indexes where appropriate
- [ ] No synchronous blocking operations in async contexts

### Maintainability
- [ ] Functions/methods have a single responsibility
- [ ] Code is DRY (no unnecessary duplication)
- [ ] Variable and function names are descriptive
- [ ] No magic numbers/strings — use named constants
- [ ] Complex logic has explanatory comments
- [ ] Dead code removed

### TypeScript Specific
- [ ] No `any` without justification
- [ ] Strict null checks respected
- [ ] Proper use of generics
- [ ] No unnecessary type assertions (`as`)
- [ ] Interfaces/types used appropriately

### Testing
- [ ] New functionality has tests
- [ ] Tests cover happy path and error cases
- [ ] No tests skipped without explanation
- [ ] Test names are descriptive

---

## Common Anti-patterns

### JavaScript/TypeScript

```typescript
// ❌ Boolean trap — unclear what `true` means
createUser('Alice', true, false, true);

// ✅ Use named parameters or an options object
createUser('Alice', { isAdmin: true, isActive: false, sendEmail: true });
```

```typescript
// ❌ Callback hell
getData(function(a) {
  getMore(a, function(b) {
    getEvenMore(b, function(c) { ... });
  });
});

// ✅ async/await
const a = await getData();
const b = await getMore(a);
const c = await getEvenMore(b);
```

```typescript
// ❌ Mutating function arguments
function addItem(list: string[], item: string) {
  list.push(item); // mutates the original
}

// ✅ Return new array
function addItem(list: string[], item: string): string[] {
  return [...list, item];
}
```

```typescript
// ❌ Catching errors silently
try {
  riskyOperation();
} catch (e) {
  // nothing
}

// ✅ Handle or rethrow
try {
  riskyOperation();
} catch (e) {
  logger.error('riskyOperation failed', e);
  throw e;
}
```

### React

```tsx
// ❌ Missing key in lists
items.map(item => <Item data={item} />);

// ✅ Stable, unique key
items.map(item => <Item key={item.id} data={item} />);
```

```tsx
// ❌ useEffect with stale closure
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // stale closure
  }, 1000);
  return () => clearInterval(interval);
}, []); // missing 'count'

// ✅ Correct dependencies
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count);
  }, 1000);
  return () => clearInterval(interval);
}, [count]);
```

### Security

```typescript
// ❌ SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ Parameterized query
const user = await prisma.user.findUnique({ where: { email } });
```

```typescript
// ❌ Hardcoded secrets
const API_KEY = 'sk-abc123...';

// ✅ Environment variable
const API_KEY = process.env.API_KEY;
```

---

## Coding Standards

### Naming Conventions
- Variables/functions: `camelCase`
- Classes/types/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case`

### Function Guidelines
- Max ~20-30 lines per function
- Max ~3 parameters (use an options object for more)
- Single responsibility principle
- Prefer pure functions (no side effects)

### Error Handling
- Always handle promise rejections
- Use specific error types, not generic `Error`
- Include context in error messages
- Log errors at the appropriate level

### Code Organization
- Imports grouped: external → internal → relative
- Types/interfaces at the top of the file
- Public API at the top of classes
- Related code grouped together

---

## Review Output Format

Organize feedback by priority:

### 🔴 Critical (must fix before merge)
Security vulnerabilities, data loss risks, breaking changes.

### 🟡 Warning (should fix)
Performance issues, code quality problems, missing error handling.

### 🟢 Suggestion (consider improving)
Readability improvements, better patterns, minor optimizations.

### ✅ OK
Code that follows best practices and looks good.

---

## Example Review Comment

```
🔴 Critical — SQL Injection Risk
File: src/users/users.service.ts, line 45

The query interpolates user input directly into a SQL string.
Use Prisma's parameterized queries instead:

// Current (vulnerable)
const result = await this.prisma.$queryRaw`SELECT * FROM users WHERE name = '${name}'`;

// Fixed
const result = await this.prisma.user.findMany({ where: { name } });
```