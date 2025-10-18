whatToWatch — Project 2 Proposal

1.  Summary

    whatToWatch helps users decide what to watch next by allowing them to build and manage personal watchlists, and receive quick, explainable recommendations. The app combines lightweight filtering, a random “Quick Pick” feature, and personalized mini-stats. Each team member owns complete vertical slices of the system—from database and API logic to the front-end interactions.

2.  Personas

    Busy Grad or Professional — wants a fast, low-effort way to pick something to watch.

    Curator — enjoys maintaining themed watchlists and sharing them with friends.

3.  Tech Stack

    Node.js + Express for the backend, MongoDB for data storage, and HTML5/CSS/ES6 modules for the front end.

4.  Data Model (Initial)

    User: id, email, password hash

    Title: id, name, type, year, overview, rating, posterUrl

    Watchlist: id, ownerId, name, items[{ titleId, addedAt, note? }]

5.  MVP Features

    User authentication

    Title search and filtering

    Multiple watchlists with add/remove functionality

    Randomized recommendations

6.  User Stories and Ownership
    Phillip

        Auth & Session

            As a user, I can sign up, sign in, and sign out securely.

            As a user, I can access only my own data once authenticated.

        Search & Filter

            As a user, I can search for a movie or show by name.

            As a user, I can filter by providers.

Kush

    Watchlists

        As a user, I can create, rename, and delete watchlists.

        As a user, I can add or remove titles from any watchlist.

        As a user, I can share a read-only link to a public version of a watchlist.

    Preferences & Recommendations

        As a user, I can set preferences such as mood, disliked genres, and maximum runtime.

        As a user, I can generate a Quick Pick recommendation based on my preferences.

        As a user, I can view recent recommendations to avoid repeats.
