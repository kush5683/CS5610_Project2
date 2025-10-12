# What to Watch

Full-stack movie discovery app built with Express, MongoDB, and a vanilla JavaScript frontend. It serves curated movie and TV-series data, lets users authenticate, and manage a personal watchlist stored in MongoDB.

## Features
- Random movie suggestion sourced directly from MongoDB.
- Paginated browsing for both movies and series.
- User registration & authentication (email/password).
- Watchlist management with duplicate protection and timestamps.
- Responsive frontend delivered from the same Express server.

## Tech Stack
- **Backend:** Node.js, Express 5, MongoDB driver.
- **Database:** MongoDB (`WhatToWatch` database with `Movies`, `Series`, `users` collections).
- **Frontend:** Vanilla JavaScript, HTML, CSS (served from `frontend/`).
- **Tooling:** Nodemon for dev reloads, ESLint + Prettier configs.

## Prerequisites
- Node.js 20+ and npm.
- MongoDB running locally on `mongodb://localhost:27017/` (default).  
  Update the connection options in `db/mongoDB.js` if you use a different URI or database name.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Import the provided JSON datasets into MongoDB to populate the `Movies` and `Series` collections:
   ```bash
   mongoimport --uri "mongodb://localhost:27017/WhatToWatch" --collection Movies --jsonArray --file movies.json
   mongoimport --uri "mongodb://localhost:27017/WhatToWatch" --collection Series --jsonArray --file tv_shows.json
   ```
3. Ensure MongoDB is running before starting the server.

## Running the App
- Start the development server (uses Nodemon for auto-reload):
  ```bash
  npm start
  ```
  > If you prefer to run without Nodemon, execute `node backend/server.js`.

- Visit the frontend at: `http://localhost:3000/`

## API Overview
| Method | Route | Description |
| ------ | ----- | ----------- |
| `GET` | `/api/get-random-movie` | Returns a single random movie document. |
| `GET` | `/api/movies?page=<n>&pageSize=<m>` | Paginated movie list (default page=1, pageSize=50). |
| `GET` | `/api/series?page=<n>&pageSize=<m>` | Paginated TV series list. |
| `POST` | `/api/register-user` | Create a user (`email`, `password`, `name`). |
| `POST` | `/api/auth-user` | Authenticate user credentials. |
| `GET` | `/api/get-user-watchlist?userId=<id>` | Retrieve a user's watchlist. |
| `POST` | `/api/add-to-user-watchlist` | Add a movie/series to the watchlist. |
| `DELETE` | `/api/remove-from-user-watchlist` | Remove a watchlist entry by movie ID. |

All watchlist requests expect MongoDB ObjectId strings for `userId`; movies/series use their imported identifiers.

## Project Structure
- `backend/` – Express server & route handlers.
- `frontend/` – Static assets, HTML pages, and client-side JS.
- `db/` – Mongo helper module used by the API routes.
- `movies.json`, `tv_shows.json` – Seed data exports for MongoDB.

## Development Notes
- Authentication is a basic email/password check stored in MongoDB; add hashing & validation before production use.
- Default MongoDB URI is hardcoded in `db/mongoDB.js`; adapt it or refactor to use environment variables as needed.

## License
MIT © Kush Shah & Phillip Chandy
