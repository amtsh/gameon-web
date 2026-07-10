# GameOn Web Technical Plan

## Goal

Rebuild the current GameOn iOS SwiftUI experience as a Next.js web app, starting with UI parity and mock data. Backend work with Turso comes later.

## Source App Summary

Reference iOS app repo:

```txt
/Users/ashinde/Developer/xcode/GameOn
```

The iOS app is a map-first local sports event app with:

- onboarding for location, name, sports, and skill levels
- full-screen map home
- floating create/location actions
- persistent bottom sheet for nearby games
- sport filter chips
- user games, recommended games, and past games
- event detail sheet
- create/edit game form
- venue search
- profile edit form
- contact info form for WhatsApp/Telegram
- join request and host approval flows

## Web Repo

Path:

```txt
/Users/ashinde/Developer/workspaces/sideprojects/gameon-web
```

Current stack:

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- TypeScript
- npm package metadata, pnpm-style node_modules currently present

Local repo instruction:

- read `node_modules/next/dist/docs/` before coding because this Next version may differ from older assumptions
- use client components for interactive UI, browser APIs, maps, and sheets

## Installed UI Packages

Use these for the UI pass:

```txt
framework7
framework7-react
@silk-hq/components
lucide-react
maplibre-gl
@vis.gl/react-maplibre
react-hook-form
zod
date-fns
use-debounce
@iconify/react
clsx
```

## Package Roles

`framework7` / `framework7-react`

- iOS-like app shell
- page/navigation primitives
- list/form patterns close to SwiftUI
- toolbar/navbar feel

`@silk-hq/components`

- bottom sheets
- modal sheets
- gesture-friendly overlays
- use for the home games sheet and detail/create/profile sheets

`maplibre-gl` / `@vis.gl/react-maplibre`

- full-screen interactive map
- custom event markers
- camera movement on event select
- later: real venue/user location display

`lucide-react`

- common UI icons: plus, user, map pin, location, chevron, archive, users

`@iconify/react`

- sports/contact icons not covered well by Lucide
- WhatsApp/Telegram-style icons

`react-hook-form` + `zod`

- create/edit game form validation
- profile form validation
- contact info validation
- later shared schema alignment with backend inputs

`date-fns`

- event date/time display
- relative grouping if needed

`use-debounce`

- venue search input debounce

`clsx`

- conditional class names for selected chips, markers, and states

## Architecture

Use a small App Router structure:

```txt
app/
  layout.tsx
  page.tsx
  globals.css
  gameon-app.tsx
  data/mock-data.ts
  types.ts
  components/
    AppMap.tsx
    FloatingActions.tsx
    GamesSheet.tsx
    EventRow.tsx
    EventDetailSheet.tsx
    CreateEventSheet.tsx
    ProfileSheet.tsx
    ContactSheet.tsx
    SportChips.tsx
```

`app/page.tsx`

- server component
- renders the client app entry

`app/gameon-app.tsx`

- client component
- owns local UI state
- selected sport filters
- selected event
- active sheet
- map camera state

Mock data stays local until Turso is introduced.

## UI Implementation Order

1. Replace starter Next page with GameOn shell.
2. Add full-screen map with mock markers.
3. Add floating create/current-location action cluster.
4. Add Silk bottom sheet for nearby games.
5. Add sport chips and event sections.
6. Add event detail sheet.
7. Add create game sheet with form controls.
8. Add profile sheet and contact form.
9. Match visual tokens from the iOS design system.
10. Run lint/build and fix issues.

## Visual Direction

Match the iOS app closely:

- map is the main background
- bottom sheet is the primary interaction surface
- rounded iOS-style controls
- compact sport chips
- bold sheet title: `Nearby Games`
- event rows with sport icon, title, venue, distance, time, capacity
- floating pill/capsule action cluster on top-left
- avoid landing page or marketing content

## Client/Server Boundary

Use `'use client'` for:

- map
- sheets
- forms
- filter state
- selected event state
- browser geolocation later

Keep `page.tsx` as a thin server component.

Avoid passing functions from server components into client components.

## Data Model For UI

Initial frontend types:

```ts
type SportKind =
  | "badminton"
  | "football"
  | "cricket"
  | "tennis"
  | "running"
  | "pickleball"
  | "basketball"
  | "volleyball"
  | "cycling";

type SkillLevel = "any" | "beginner" | "intermediate" | "advanced";

type SportEvent = {
  id: string;
  title: string;
  sport: SportKind;
  skillLevel: SkillLevel;
  startsAt: string;
  endsAt: string;
  venue: {
    name: string;
    address?: string;
    city?: string;
    latitude: number;
    longitude: number;
  };
  capacity: number;
  joinedCount: number;
  cost?: string;
  description?: string;
  isCreatedByCurrentUser?: boolean;
  isJoined?: boolean;
  hasPendingRequest?: boolean;
  hostContact?: {
    method: "whatsapp" | "telegram";
    value: string;
  };
};
```

## Backend Boundary Later

Do not add Turso during the UI pass.

When ready:

- add `@libsql/client`
- define schema and migrations
- add API routes or server actions
- replace mock data with Turso reads
- keep SwiftData as local iOS cache or migrate iOS to shared API

Likely tables:

- users
- sport_preferences
- venues
- sport_events
- event_join_requests
- contact_info

## Map Notes

For the UI pass:

- use a public raster/vector style if available
- otherwise use a styled placeholder map surface to avoid blocking UI work
- markers should be custom React elements matching `EventMapMarker.swift`

Later:

- choose MapTiler, Stadia, Protomaps, or self-hosted tiles
- add venue search via a geocoding provider
- add browser geolocation

## Form Notes

Create Game form fields:

- sport chips
- skill level select
- venue picker/search
- title
- start date/time
- end date/time
- cost
- capacity stepper
- fill your spot toggle
- contact section
- description

Profile form fields:

- postal code
- name
- contact
- interested sports
- levels by sport

Contact form:

- segmented WhatsApp/Telegram
- value input
- validation messages

## Validation

Use `zod` schemas for:

- contact info
- create event
- profile edit

Keep schemas frontend-local for now. Move/share later when backend starts.

## Verification

Run:

```bash
npm run lint
npm run build
```

If map libraries cause SSR issues:

- keep map components behind `'use client'`
- use dynamic import with SSR disabled only if necessary

## Non-Goals For This Pass

- no Turso integration
- no auth
- no real venue search
- no real geolocation persistence
- no join request persistence
- no deployment setup
- no iOS code changes

## First Deliverable

A working Next.js UI prototype that visually and behaviorally mirrors the iOS app enough to evaluate:

- map-first layout
- bottom sheet behavior
- event browsing
- event detail flow
- create game flow
- profile/contact flow
