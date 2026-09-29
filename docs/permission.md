# MoveLib permissions

MoveLib uses two application roles:

- `USER`
- `ADMIN`

Authentication is handled by Supabase Auth.

Authorization is enforced primarily by PostgreSQL Row Level Security (RLS). UI visibility is used to improve the user experience, but must not be considered the security boundary.

## Shared exercise library

Exercises, variants and tags belong to the shared MoveLib library.

| Action                        | USER | ADMIN |
| ----------------------------- | ---- | ----- |
| View exercises                | Yes  | Yes   |
| Create exercises              | Yes  | Yes   |
| Edit exercises                | Yes  | Yes   |
| Delete exercises              | No   | Yes   |
| Create variants               | Yes  | Yes   |
| Edit variants                 | Yes  | Yes   |
| Delete variants               | No   | Yes   |
| Create tags                   | Yes  | Yes   |
| Edit tags                     | Yes  | Yes   |
| Delete tags                   | No   | Yes   |
| Associate tags with exercises | Yes  | Yes   |

The library is collaborative: authenticated users can contribute exercises and edit existing content.

Destructive operations on shared library entities are reserved for administrators.

## Favourites

Exercise favourites are private to each user.

A user can:

- view their own favourites;
- add exercises to their favourites;
- remove exercises from their favourites.

A user cannot access another user's favourites.

## Lessons

Lessons belong to the user who created them.

A user can:

- view their own lessons;
- create lessons;
- edit their own lessons;
- delete their own lessons;
- add and reorder exercises in their own lessons.

Users cannot access another user's lessons.

Exercises referenced by lessons remain part of the shared exercise library.

## Calendar

Class presets and scheduled classes belong to individual users.

A user can manage only their own:

- class presets;
- scheduled classes;
- lesson associations;
- calendar colors.

Deleting a scheduled class does not delete its associated lesson.

Deleting a saved custom calendar color removes it only from the user's reusable color palette. Existing presets and scheduled classes retain their stored hexadecimal color value.

## Registration administration

Only `ADMIN` users can:

- view registration requests;
- approve registration requests;
- reject registration requests;
- access administrative pages.

Administrative routes must verify the user's role server-side even when the corresponding navigation elements are hidden from normal users.

## Security principle

Frontend role checks are for user experience only.

Database permissions and RLS policies are the authoritative security layer. Sensitive server-side operations, such as approving a registration and inviting a Supabase Auth user, also perform an explicit administrator check before using privileged credentials.
