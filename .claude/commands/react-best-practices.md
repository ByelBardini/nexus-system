---
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns.
---

# React Best Practices

Comprehensive performance optimization guide for React and Next.js applications. Contains rules across 8 categories, prioritized by impact.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## 1. Eliminating Waterfalls (CRITICAL)

### async-defer-await
Move `await` into branches where actually needed, not at the top of functions.

```typescript
// Bad
const [user, posts] = await Promise.all([getUser(), getPosts()]);
if (!user) return null;
return { user, posts };

// Good
const userPromise = getUser();
const postsPromise = getPosts();
const user = await userPromise;
if (!user) return null;
return { user, posts: await postsPromise };
```

### async-parallel
Use `Promise.all()` for independent async operations.

```typescript
// Bad
const user = await getUser(id);
const posts = await getPosts(id);

// Good
const [user, posts] = await Promise.all([getUser(id), getPosts(id)]);
```

### async-api-routes
Start promises early, await late in API routes.

### async-suspense-boundaries
Use Suspense to stream content incrementally — wrap independent data-fetching components.

---

## 2. Bundle Size Optimization (CRITICAL)

### bundle-barrel-imports
Import directly from source files, avoid barrel files.

```typescript
// Bad
import { Button, Input, Label } from '@/components/ui';

// Good
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
```

### bundle-dynamic-imports
Use `React.lazy` / `next/dynamic` for heavy components not needed on initial load.

```typescript
const HeavyChart = React.lazy(() => import('./HeavyChart'));
// or in Next.js:
const HeavyChart = dynamic(() => import('./HeavyChart'), { ssr: false });
```

### bundle-defer-third-party
Load analytics/logging/tracking scripts after hydration.

### bundle-conditional
Load modules only when a feature is activated (e.g., after user interaction).

### bundle-preload
Preload on hover/focus to improve perceived speed.

---

## 3. Server-Side Performance (HIGH)

### server-cache-react
Use `React.cache()` for per-request deduplication in React Server Components.

### server-cache-lru
Use LRU cache for cross-request caching of expensive computations.

### server-serialization
Minimize data passed from Server Components to Client Components.

### server-parallel-fetching
Restructure components to allow parallel data fetching.

### server-after-nonblocking
Use `after()` for non-blocking side effects (logging, analytics) that shouldn't block the response.

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### client-swr-dedup
Use SWR or TanStack Query for automatic request deduplication — multiple components requesting the same data will share a single fetch.

### client-event-listeners
Deduplicate global event listeners — use a single listener at the top level rather than per-component.

---

## 5. Re-render Optimization (MEDIUM)

### rerender-defer-reads
Don't subscribe to state that is only used inside event handlers.

```typescript
// Bad — re-renders on every count change even though count only used in handler
const count = useStore(s => s.count);
const handleClick = () => doSomething(count);

// Good — use ref to read latest value without subscribing
const countRef = useRef(count);
const handleClick = () => doSomething(countRef.current);
```

### rerender-memo
Extract expensive computations into memoized components or `useMemo`.

### rerender-dependencies
Use primitive values (not objects/arrays) as effect dependencies.

```typescript
// Bad
useEffect(() => {}, [user]); // re-runs whenever user reference changes

// Good
useEffect(() => {}, [user.id]); // only re-runs when id changes
```

### rerender-derived-state
Derive and subscribe to booleans, not raw values.

```typescript
// Bad
const status = useStore(s => s.status); // re-renders on any status change
const isLoading = status === 'loading';

// Good
const isLoading = useStore(s => s.status === 'loading'); // only re-renders when loading state changes
```

### rerender-functional-setstate
Use functional setState for stable callbacks.

```typescript
// Bad — handler is recreated on each render due to count dependency
const handleClick = () => setCount(count + 1);

// Good — stable reference
const handleClick = () => setCount(prev => prev + 1);
```

### rerender-lazy-state-init
Pass a function to `useState` for expensive initial values.

```typescript
// Bad — runs on every render
const [state] = useState(expensiveComputation());

// Good — runs only once
const [state] = useState(() => expensiveComputation());
```

### rerender-transitions
Use `startTransition` for non-urgent updates to keep the UI responsive.

---

## 6. Rendering Performance (MEDIUM)

### rendering-hoist-jsx
Extract static JSX (not dependent on props/state) outside of components.

```typescript
// Bad — recreated on every render
function Component() {
  const icon = <svg>...</svg>;
  return <div>{icon}</div>;
}

// Good
const icon = <svg>...</svg>;
function Component() {
  return <div>{icon}</div>;
}
```

### rendering-conditional-render
Use ternary (`? :`), not `&&` for conditional rendering (avoids rendering `0`).

```typescript
// Bad — renders "0" when count is 0
{count && <Badge>{count}</Badge>}

// Good
{count > 0 ? <Badge>{count}</Badge> : null}
```

### rendering-content-visibility
Use `content-visibility: auto` CSS for long lists to skip rendering off-screen items.

### rendering-activity
Use the `<Activity>` component for show/hide patterns to preserve state without re-mounting.

### rendering-hydration-no-flicker
Use inline `<script>` for client-only data (like theme) to avoid hydration flicker.

---

## 7. JavaScript Performance (LOW-MEDIUM)

### js-index-maps
Build a `Map` for O(1) repeated lookups instead of repeated `Array.find()`.

```typescript
// Bad — O(n) per lookup
const getUser = (id: string) => users.find(u => u.id === id);

// Good — O(1) per lookup
const userMap = new Map(users.map(u => [u.id, u]));
const getUser = (id: string) => userMap.get(id);
```

### js-set-map-lookups
Use `Set` for membership checks instead of `Array.includes()`.

### js-cache-function-results
Cache expensive function results in a module-level `Map`.

### js-combine-iterations
Combine multiple `filter`/`map` passes into a single `reduce` or loop.

### js-early-exit
Return early from functions to avoid unnecessary computation.

### js-hoist-regexp
Hoist `RegExp` creation outside of loops.

```typescript
// Bad
for (const item of items) {
  if (/pattern/.test(item)) { ... }
}

// Good
const pattern = /pattern/;
for (const item of items) {
  if (pattern.test(item)) { ... }
}
```

### js-tosorted-immutable
Use `toSorted()` instead of `sort()` to avoid mutating the original array.

---

## 8. Advanced Patterns (LOW)

### advanced-event-handler-refs
Store event handlers in refs to avoid re-registering event listeners.

### advanced-use-latest
Use a `useLatest` hook to get stable callback refs that always point to the latest function.

```typescript
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => { ref.current = value; });
  return ref;
}
```