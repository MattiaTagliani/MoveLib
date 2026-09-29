# MoveLib

MoveLib is a web application for organizing a shared library of circus and movement exercises, building lessons and planning classes.

The project is designed for teachers who need to quickly save, find and reuse exercises while preparing their lessons.

## Features

### Exercise library

- Shared exercise library
- Exercise name and description
- Minimum and maximum recommended age
- Reusable tags
- Exercise variants
- Search and filtering
- Age-range filtering
- Multiple tag filters
- Per-user favourites

### Lessons

- Personal lessons for each user
- Add exercises from the shared library
- Use the same exercise multiple times
- Select a different exercise variant for each occurrence
- Drag-and-drop exercise ordering
- Search and filter the exercise library while building a lesson

### Calendar

- Monthly calendar
- One-off scheduled classes
- Reusable class presets
- Recurring class generation over a date range
- Optional lesson association
- Independent editing of generated occurrences
- Custom event colors
- Reusable personal color palette

### Registration

MoveLib does not currently use open self-registration.

Users submit an access request. An administrator can review the request and, when approved, send an invitation through Supabase Auth.

## Roles and permissions

MoveLib currently has two roles:

- `USER`
- `ADMIN`

The exercise library is collaborative. Both USER and ADMIN accounts can create and edit shared exercises.

Only administrators can perform destructive operations on shared library entities and manage registration requests.

Lessons, favourites, calendar events, class presets and saved calendar colors are user-specific.

Detailed permissions are documented in:

`docs/permissions.md`

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- PostgreSQL Row Level Security
- dnd-kit

## Project structure

```text
app/
  auth/                 Authentication and access-request pages
  protected/            Authenticated application pages

components/
  admin/                Administrative UI
  calendar/             Calendar, presets and scheduling
  exercises/            Exercise library and editor
  lessons/              Lesson library and builder
  ui/                   Shared UI components

lib/
  supabase/             Supabase clients and helpers

docs/
  permissions.md        Role and data-access documentation
```

## Environment variables

Create a `.env.local` file for local development.

The application uses the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Never commit `.env.local` or secret Supabase credentials to the repository.

## Local development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The project currently runs Next.js development mode with Webpack:

```json
"dev": "next dev --webpack"
```

This is intentional for the current Windows development environment.

Then open:

```text
http://localhost:3000
```

## Database and security

MoveLib uses Supabase PostgreSQL.

Access to application data is controlled with PostgreSQL Row Level Security policies.

The frontend may hide actions that are unavailable to a user's role, but frontend checks are not considered a security mechanism. Database RLS and server-side authorization remain authoritative.

Privileged Supabase credentials must only be used in server-side code.

## Current development status

Implemented:

- authentication and invitation-based registration;
- USER and ADMIN roles;
- shared exercise library;
- exercise variants;
- reusable tags;
- favourites;
- lesson creation and editing;
- drag-and-drop lesson exercise ordering;
- per-occurrence exercise variants;
- lesson library;
- monthly calendar;
- reusable class presets;
- recurring class scheduling;
- lesson/calendar association;
- custom calendar colors;
- reusable personal calendar color palette.

Planned work includes reusable lesson sections/chunks and additional library export/backup functionality.
