# Architecture

Two layers. `src/domain/` is pure: it holds the rules and knows nothing about
storage or transport. `src/api/` speaks HTTP.

## Rules

1. `src/domain/**` must not import anything from `src/api/**`, and must not
   import a database driver or an HTTP framework.
2. All SQL lives in `src/api/repository.js`. No other file builds a query.
3. Every request handler must call `requireSession(req)` before doing anything
   else. This is an invariant: a handler without it is a security hole.
