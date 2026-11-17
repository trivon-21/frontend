# Airlux frontend

Airlux is a team-created application maintained in [Trivon](https://github.com/trivon-21). The original team designed the application and its business workflows. Sathnuwan Dassana continues its development and maintenance, including the Spartan UI migration and deployment work. Git history preserves contributors' authorship; see [migration progress](docs/MIGRATION.md) for verified continuation work.

## Development
Use Node 24 (`nvm install && nvm use`) and npm 11 (`npm install -g npm@11.21.2`), then `npm ci`. Work on feature branches from `dev`; send reviewed changes to `dev`, with verified releases to `main`.

Run `npm start` for the Angular server on port 4200; the development proxy sends `/api` to localhost:5000. Run `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless` for verification.

## Hosting
Vercel builds to `dist/frontend/browser`. Set `AIRLUX_API_URL` to the HTTPS backend base including `/api`. `npm run build:deploy` validates and generates the public build configuration; it must never contain private keys. Configure the Vercel project to track `dev` previews and later `main` production releases. See migration progress for verification and deployment status.

## Spartan pilot and checks
The dispatch/logistics screen uses generated Spartan 1.9.0 button, input, badge, and dialog components on Angular 22 / Tailwind 4. Other working portals remain available with their existing UI. The Vega stylesheet is limited to installed components; shared legacy variables remain during migration. The inventory shell has responsive mobile navigation.

Run `npm run test:browser` after `npx playwright install chromium`. For an existing Chrome installation, use `CHROME_BIN=/usr/bin/google-chrome npm run test:browser`. Browser tests use synthetic HTTP fixtures; real backend dispatch transitions were checked separately against disposable MongoDB.

[Desktop preview](docs/assets/dispatch-desktop.png) · [Dialog preview](docs/assets/dispatch-dialog.png) · [Mobile preview](docs/assets/dispatch-mobile.png)

The API build setting routes maintenance, finance, and inspection services as well as the shared API service. `npm run build:deploy` requires an HTTPS API URL ending in `/api`; normal local builds default to the development proxy path. Vercel environment changes require a rebuild.
