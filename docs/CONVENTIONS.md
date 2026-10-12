<!-- @format -->

# Codebase Conventions

These rules apply to every package. If a rule doesn't fit a case, raise it instead of quietly breaking it.

## Stack

| Concern                          | Use                                     |
| -------------------------------- | --------------------------------------- |
| UI components                    | shadcn/ui (Tailwind 4)                  |
| Client data fetching and caching | TanStack Query                          |
| Forms                            | React Hook Form + `zodResolver`         |
| Validation                       | zod, at every boundary                  |
| DB access                        | Prisma, **only inside `packages/core`** |

## Layout (`apps/web/src`)

```
app/                 routes only: page.tsx, layout.tsx, route.ts, loading/error
components/
  ui/                shadcn generated; wrap, don't heavily edit
  <feature>/         hackathons/, teams/, queue/, review/, …
hooks/               ALL hooks: use-<name>.ts (queries, mutations, UI hooks)
server/
  actions/           "use server" server actions, one file per feature
  queries/           server-only data loaders used by server components
  auth.ts            session helpers (requireUser, …)
schemas/             zod schemas used only by the web app (form-only shapes)
types/               ALL web-only types and interfaces
lib/                 utilities: query client, query keys, api-response, time formatting
```

Domain schemas and types shared with the worker and the API live in `packages/core` (`schemas/`, `types/`). The web app imports them from there.

## Components

- Never define a hook inside a component file. Hooks live in `hooks/`, one per file, named `use-x.ts` and exporting `useX`.
- Never declare types or interfaces in a component or page file. The only exception is that component's own `Props` type.
- Pages and layouts are server components by default. Put `"use client"` on the smallest component that needs it (leaf components).
- Files are named in kebab-case (`hackathon-card.tsx`). Components are PascalCase.
- **Keep UI text minimal:** short labels, icons with tooltips, no explanatory paragraphs. Empty states get one line.

## Data flow

**Reads**

- A server component calls a loader in `server/queries/*`, which calls `packages/core`.
- If a client component needs the same data to stay live or update after mutations, the page prefetches it into a `QueryClient` and wraps it in a `HydrationBoundary`. The client component then reads it with a `useQuery` hook from `hooks/`.
- Query keys live in `lib/query-keys.ts`. Never write a query key inline.

**Writes**

- A server action in `server/actions/*` is called through a `useMutation` hook in `hooks/`.
- On success, the hook invalidates the affected query keys (and calls `router.refresh()` when server-rendered data is affected).

**Server-only code:** files in `server/` start with `import "server-only"`.

**Layering:**

- Apps never import `@prisma/client` or `packages/db`; only `packages/core` does.
- Actions, route handlers and worker jobs stay thin: parse the input, resolve the actor, call core, map the result.

## Validation

**Never trust input.** Use zod to parse every:

- server action argument
- route handler body, query string and params
- BullMQ job payload, in the worker
- environment variable, at startup (`env.ts`)

Forms use the same zod schema on the client (React Hook Form) and the server (the action). Client-side validation is for user experience only; the server always validates again.

After parsing, data has the parsed type. Core functions accept parsed types, not `unknown`.

## Server action results

Server actions never throw for expected failures. They return:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
      };
    };
```

`fields` holds zod field errors, so forms can show them next to the right input.

## HTTP APIs (`app/api/v1/**/route.ts`)

Every response goes through the helpers in `lib/api-response.ts`. Errors always use this shape:

```json
{ "error": { "code": "validation_failed", "message": "…", "details": {} } }
```

| Status | When                                                                                         |
| ------ | -------------------------------------------------------------------------------------------- |
| 200    | Successful read or update                                                                    |
| 201    | Created synchronously                                                                        |
| 202    | Accepted for async processing (ingest)                                                       |
| 400    | Malformed JSON or zod validation failed (`details` = flattened issues)                       |
| 401    | Missing or invalid API key or session                                                        |
| 403    | Revoked key or not allowed                                                                   |
| 404    | Not found                                                                                    |
| 409    | State conflict (e.g. duplicate)                                                              |
| 413    | Batch or payload too large                                                                   |
| 500    | Unexpected error. Log the details; return a generic message with no stack trace or internals |

Also:

- Wrong method → 405, which Next does automatically for unexported methods.
- Every route handler wraps its body in a try/catch that maps known core errors to these codes.

## TypeScript

- `strict` mode on. No `any`; use `unknown` and narrow it.
- No non-null `!` except right after a check you can see.
- Infer types from zod (`z.infer`) instead of duplicating them by hand.

## Time

Store UTC. Show IST only through the helpers in `lib/time.ts`. Never call `toLocaleString` directly in components.

## Activity log

Every change made through core writes an ActivityLog row in the same transaction. A core function that changes data without logging it is a bug.
