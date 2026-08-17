# DIU FoundHub

**Lost and Found** is a full-stack Lost & Found platform for Daffodil International University. It allows visitors to browse reports, authenticated students and staff to publish lost or found items, owners to submit private claims, and authorized DIU staff to verify ownership and complete returns.

## GitHub Repository Structure

```text
diu-foundhub/
├── frontend/        # React, TypeScript, Tailwind CSS, and UI components
├── backend/         # Express, tRPC, authentication, business logic, and tests
├── database/        # Drizzle schema and complete migration history
├── shared/          # Shared validation, constants, and domain types
├── tests/           # Test-suite guidance; Vitest specs are colocated in backend/
├── docs/            # Architecture and project documentation
├── .github/         # GitHub Actions continuous-integration workflow
├── .env.example     # Local environment-variable template
├── package.json     # Project scripts and dependencies
└── README.md        # Setup and usage instructions
```

Copy `.env.example` to `.env`, set `DATABASE_URL` and a strong `JWT_SECRET`, then run `pnpm install`, `pnpm drizzle-kit migrate`, and `pnpm dev`. The local site starts at `http://localhost:3000`.

## Functional Overview

| Area | Implementation |
|---|---|
| Authentication | Manual Gmail-and-password registration and login with salted password hashes, secure HTTP-only sessions, logout, protected procedures, and role-aware navigation |
| DIU profiles | Name, email, student or staff ID, department, phone, affiliation, and preferred report contact |
| Item reporting | Separate lost and found forms with validation, dates, locations, contact details, holding locations, and cloud photos |
| Public discovery | Database-backed search, report/category/date/status filters, sorting, pagination, and responsive item cards |
| Ownership | Private unique identifiers and proof descriptions restricted to the claimant and staff reviewers |
| Staff workflow | Live metrics, pending-claim queue, approve/reject controls, listing management, and return completion |
| Status tracking | Exact lifecycle labels: **Lost**, **Claimed**, **Verified**, and **Returned** |
| Notifications | In-app alerts and email-delivery audit records for item matches, submitted claims, and approved/rejected claims |
| Storage | Item photos are stored in the built-in S3-compatible service; the database stores only image keys and URLs |

## Application Routes

| Route | Purpose | Access |
|---|---|---|
| `/` | Public product landing page and live database counts | Public |
| `/login` | Dedicated Gmail-and-password login page | Public |
| `/register` | Manual registration with name, student ID, Gmail address, and password; continues to DIU profile setup | Public |
| `/browse` | Searchable and filterable item board | Public |
| `/report/lost` | Lost-item report form | Authenticated profile |
| `/report/found` | Found-item report form | Authenticated profile |
| `/items/:id` | Item details, timeline, claims, and controls | Public with authenticated actions |
| `/items/:id/edit` | Edit an open report | Reporter or staff admin |
| `/profile` | DIU profile, personal reports, and claim history | Authenticated |
| `/notifications` | Match, claim, and decision alerts | Authenticated |
| `/admin` | Staff operations overview and listing management | Staff admin |
| `/admin/claims` | Private claim evidence and review decisions | Staff admin |

## Technology Stack

The client uses React 19, TypeScript, Tailwind CSS 4, Wouter, and shadcn/Radix components. The server uses Express, tRPC, Zod, Drizzle ORM, and MySQL/TiDB. Authentication, storage, and deployment services are provided by the managed application scaffold.

## Data Model

The database contains `users`, `local_credentials`, `profiles`, `items`, `claims`, `status_history`, `item_matches`, `notifications`, and `email_deliveries`. `local_credentials` stores a salted, one-way password hash plus unique Gmail and student-ID identifiers; it never stores plain-text passwords. Foreign keys protect related records, uniqueness constraints prevent duplicate accounts, profiles, and claims, and targeted indexes support public listing filters, search, claim queues, ownership history, and notifications.

## Status Rules

| Current | Next | Trigger |
|---|---|---|
| Lost | Claimed | An authenticated owner submits a claim |
| Claimed | Verified | Authorized staff approves ownership proof |
| Claimed | Lost | Staff rejects the final pending claim |
| Verified | Returned | Staff confirms physical handover |
| Returned | None | Terminal state |

## Email Activation

In-app notifications and email outbox records work without external credentials. To send real outbound email, add these server-side project secrets:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | A valid Resend API key |
| `RESEND_FROM_EMAIL` | A verified sender such as `Lost and Found <alerts@example.com>` |

When these values are absent, required alerts remain available in the application and the corresponding email-delivery record is marked `skipped` rather than failing the user action. When credentials are present, the server sends immediately and records the provider message ID or failure reason.

## Staff Access

Only users whose `users.role` value is `admin` can call staff procedures. The project owner is promoted automatically by the authentication scaffold. Additional authorized DIU staff can be promoted through the database management interface by changing their role from `user` to `admin` after institutional verification.

## Validation and Privacy

All mutations use server-side Zod validation and role or ownership checks. Image uploads accept JPG, PNG, or WebP files up to 5 MB. Public listings never expose private ownership identifiers or proof descriptions; those fields are returned only through the authenticated claimant history and staff review procedures.

## Quality Commands

| Command | Purpose |
|---|---|
| `pnpm check` | TypeScript validation |
| `pnpm test` | Vitest specifications for auth, permissions, matching, validation, lifecycle, and notification events |
| `pnpm build` | Optimized client build and bundled server build |

## Publish to GitHub

After creating an empty GitHub repository, use the following commands from this folder:

```bash
git add .
git commit -m "Initial commit: DIU FoundHub Lost & Found platform"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/diu-foundhub.git
git push -u origin main
```

