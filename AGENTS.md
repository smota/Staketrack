# Staketrack

Staketrack is a Vue 3 and Firebase app for stakeholder relationship management.

## Layout

- `src/`: Vue components, views, routing, services, and stores.
- `js/`: JavaScript modules covered by the Jest configuration.
- `functions/`: Firebase Cloud Functions.
- `tests/`: unit and browser tests.
- `docs/`: setup, deployment, and feature documentation.

## Commands and conventions

- Install project dependencies with `npm ci`.
- Start local development with `npm run serve`.
- `npm run lint` fails on the current code (657 errors) and `npm run test:unit` finds no tests on Windows, so `ciCommands` is empty until the follow-up issue restores them. Do not add commands that fail on the base.
- Run `npm run test:e2e` only with browsers and Firebase available.
- Keep secrets in ignored environment files, as described in README.md.
- Keep application changes separate from delivery tooling changes.

## How work enters this repo

- GitHub Issues on `smota/Staketrack` are the backlog.
- Use one issue, one `work/<slug>` branch, and one PR with `Closes #<n>`.
- The trunk and PR target are `main`.
- Run AgentFlow `bounded` role passes with one agent by default.
- Run the verify list in `agent-workflow.config.json` before the PR.
- Samuel merges with squash.
- Use Meshloop only when the user names it.
