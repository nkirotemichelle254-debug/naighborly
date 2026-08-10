# Nairobi Neighborly Hub

Naighborly Handoff

What This Project Is

Naighborly is a Nairobi-focused neighborhood exchange app for:

items

services

swaps

The app is designed to feel warm, community-first, and mobile-led, with a kitenge texture used on hero and action surfaces.

Stack

Plain HTML

Plain CSS

Plain JavaScript

Google Fonts: Syne, Space Grotesk, Plus Jakarta Sans, Inter

No React, no Tailwind, no framework migration.

Design References

Home: https://www.figma.com/design/ETwkeqNq9jQWLcI0WL3E7s/Neighborhood-Exchange-App?node-id=69-679

Create step 1: https://www.figma.com/design/ETwkeqNq9jQWLcI0WL3E7s/Neighborhood-Exchange-App?node-id=69-957

Create step 3 / details form: https://www.figma.com/design/ETwkeqNq9jQWLcI0WL3E7s/Neighborhood-Exchange-App?node-id=74-2027

Main Files

home.html

create.html

details.html

profile.html

inbox.html

styles.css

app.js

kitenge-pattern.jpg

Current Product State

Home

Home renders the community feed from base posts plus user-created posts from localStorage.

Live search filters the feed by title, description, category, intent, and location.

Clicking a feed card opens details.html?post=<id>.

The home header/search area is now sticky.

The bottom navigation is fixed so it stays visible while scrolling.

Urgent styling and the red alert badge only render when post.urgent is true.

Details

Details page reads the selected post from the post query param.

Invalid or stale post links now show a proper fallback state instead of silently opening the wrong post.

If a post includes uploaded photos, they render in a photo grid near the top of the details view.

Message deep-links into the inbox for that post.

Call only appears if the post explicitly allows calls and has a phone number.

The details header is sticky and the bottom nav is fixed.

The red alert marker on details only shows when the post is urgent.

Create

Create flow is still 3-step:

category

intent

post details

Category and intent are not preselected anymore.

The CTA stays disabled until the current step is valid.

Photos are required only for Item + Offer.

Photos are optional for:

item requests

service offers

service requests

swaps

Users can optionally enable Allow phone calls, which reveals a phone field.

Published posts are stored in localStorage under naighborly-user-posts.

Uploaded photos are stored as data URLs on the saved post.

The create header is sticky and the bottom nav is fixed.

Inbox

Inbox now supports selecting a specific thread.

Clicking a thread updates the active conversation panel.

details -> Message opens the thread related to that post when possible.

Inbox header is sticky.

Inbox bottom nav is fixed.

Thread content is still lightweight/static mock data, but it now switches correctly based on the selected thread/post.

Profile

Profile renders Michael Heri's posts using the actual current post data.

Stats are derived from current post data.

Profile cards still link through to valid details pages.

Desktop / Responsive

Desktop view was adjusted to be flush instead of showing rounded app-frame edges floating over the page background.

Sticky/fixed controls were preserved across the app.

Main next-pass risk is still visual tuning of spacing and sticky regions at larger breakpoints.

Data Shape Notes

User-created posts may now include fields like:

id

title

description

details

category

intent

location

tone

urgent

owner

ownerInitials

time

allowCalls

phone

photos

note

Important Behavior Rules Already Implemented

Red exclamation badges only appear for urgent posts.

Call is hidden unless the poster opted into calls.

Photos only become required for item offers.

Details page shows post photos if the post has them.

Clicking a conversation in inbox opens that conversation.

Fixed bottom controls and sticky top controls are now part of the layout.

Verification Status

app.js passed syntax check using the bundled Node runtime:

C:\Users\Sparkwave\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe --check app.js

Verification so far was code-level plus targeted logic review.

A full browser QA pass was not completed in this session.

Known Caveats / Best Next Pass

Do a manual click-through of:

Home -> Details

Details -> Message -> Inbox thread

Create -> Publish -> Home -> Details -> Profile

Check sticky header/fixed footer behavior on both narrow mobile and wide desktop layouts.

Large image uploads may eventually run into localStorage size limits because photos are stored as data URLs.

Inbox is still mock-message based; thread switching works, but sending/persisting messages is not implemented.

If any visual issue appears next, the most likely follow-up work is spacing polish, sticky offset tuning, and large-screen layout refinement.

Best Resume Prompt

Use this in a fresh chat:

Open PROJECT_HANDOFF.md in C:\\Users\\Sparkwave\\Documents\\New project, inspect the current Naighborly app, and continue from there. Preserve the existing HTML/CSS/JS stack, the Figma-aligned Nairobi community aesthetic, and the kitenge-pattern.jpg treatment. The current app already has sticky top controls, fixed bottom nav, inbox thread selection, optional call permissions, and photo rendering on details. Audit the full live flow Home -> Details -> Message -> Inbox -> Create -> Publish -> Home -> Profile, then fix any visual, sticky-layout, or interaction issues you find without converting the stack.

Short Resume Prompt

If you want an even shorter version:

Open PROJECT_HANDOFF.md in C:\\Users\\Sparkwave\\Documents\\New project and continue Naighborly from the current state. Keep plain HTML/CSS/JS, preserve the Figma look, and audit the sticky header/footer, inbox thread behavior, call permissions, photo upload/rendering, and full create/details/profile flow.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://naighborly.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/847b8876-261e-461b-9223-04708c98102b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
