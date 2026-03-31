# Club 602 Putting League

The official live leaderboard and scoring application for the Club 602 Putting League.

This project was built using [React](https://react.dev/) and is bundled with [Vite](https://vitejs.dev/).

## Getting Started

### Prerequisites

- Node.js (version matching your environment)
- A Firebase project for database/auth

### Running Locally

In the project directory, you can run:

#### `npm run start` (or `npm run dev`)

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
The page will hot-reload when you make changes.

#### `npm run test`

Launches the [Vitest](https://vitest.dev/) test runner in interactive watch mode.
Use this to run and verify unit tests. Note: to prevent Firebase initialization errors in tests, you may need to provide dummy API keys in your environment variables.

#### `npm run build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for best performance, including splitting out vendor chunks (like Firebase, React, and Lucide) to keep bundle sizes manageable.

#### `npm run preview`

Boots up a local static web server that serves the files from your `build` folder. This allows you to preview your production build locally before deploying.

## Configuration & Environment Variables

Environment variables must be prefixed with `VITE_` (e.g., `VITE_FIREBASE_API_KEY`) and are accessed in the code via `import.meta.env`.

## Architecture & Tooling

- **Frontend Framework:** React 19
- **Bundler:** Vite
- **Testing:** Vitest + React Testing Library + Playwright
- **Styling:** Tailwind CSS + Headless UI + Framer Motion
- **Icons:** Lucide React
- **Backend/Database:** Firebase (Auth, Firestore)
