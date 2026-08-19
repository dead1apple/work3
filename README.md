# work3
work3商城项目

## E2E browser requirement

The Playwright commerce regression runs with the installed Chrome channel because this Windows workspace could not complete the managed Chromium download. Run it with `npm run test:e2e`; the runner owns Vite on `127.0.0.1:4173` and fails if another server is already responding there.
