# What to Watch Data Fetcher

This repository contains a Python utility for building curated What to Watch JSON datasets from The Movie Database (TMDB). The script gathers high-popularity movies and TV shows, enriches them with provider information, and saves two JSON files for coursework or web projects.

## Requirements
- Python 3.10 or newer
- requests Python package (install with `pip install requests` inside a virtual environment)
- TMDB v3 API key and v4 access token with permission to read public data

## Configuration
The script stores placeholder credentials in get-data.py. Replace both the api_key query parameter and the Authorization bearer token with your personal TMDB credentials before running the script.

For long-term use, consider moving these credentials into environment variables to avoid committing secrets.

Key tuning knobs inside get-data.py:
- MAX_MOVIES: upper bound on how many movie and TV entries to collect (defaults to 3000)
- MAX_WORKERS: number of concurrent requests made while paging through the API (defaults to 5)
- Filter logic inside build_movie and build_TV: only items with posters, vote counts above 700, and release or air dates up to 2025 are written to the JSON files

## Usage
1. Install dependencies: pip install requests
2. Run the scraper: py get-data.py

The script writes two files in the project root:
- movies.json
- tv_shows.json

Each entry includes metadata, vote counts, and a list of U.S. streaming providers with logo URLs.

### Rate limiting
The script requests multiple pages in parallel, speeding up collection but increasing the risk of hitting TMDB rate limits if you raise MAX_WORKERS. Start with the default and scale cautiously.

## Attribution
Data and images are provided by TMDB. When displaying or redistributing this content, you must credit TMDB and follow their attribution guidelines. Official logos and usage instructions are available at the TMDB attribution page: https://www.themoviedb.org/about/logos-attribution.

## Troubleshooting
- HTTP errors usually indicate an expired key or a quota issue—double-check your TMDB credentials.
- Empty results may mean the filters are excluding everything; relax the vote count or date conditions in build_movie or build_TV if needed.

## License
No explicit license has been provided. Treat this as coursework material and consult your instructor before sharing externally.
# CS5610_Project2
