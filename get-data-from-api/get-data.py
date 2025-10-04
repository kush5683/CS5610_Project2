import json
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

headers = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2MTI3MjdiZGQxMTUwNzQ2ZjgzMjkwOWVmNThhYzc2NyIsIm5iZiI6MTc1OTUxNzU5Ny45NDMsInN1YiI6IjY4ZTAxYjlkYmJiODQzZWFiZDA4ZTk3YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.RIh_s2jkVqYmmm0Ebv_uTupg7ljZ0oDHdWQo5rpJRmE",
    "accept": "application/json",
}

poster_base_url = "https://image.tmdb.org/t/p/w500"
MAX_MOVIES = 3000
MAX_TV = 300
MAX_WORKERS = 5

def get_movie_providers(movie_id: int) -> list[str]:
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    data = response.json().get("results", {}).get("US", {})
    providers = []
   

    for key in ["flatrate", "rent"]:
        for provider in data.get(key, []):
            providers.append({"name":provider["provider_name"], "logo_path":f"{poster_base_url}{provider['logo_path']}"})

    return list(providers)

def get_tv_providers(tv_id: int) -> list[str]:
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/watch/providers"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    data = response.json().get("results", {}).get("US", {})
    providers = []

    for key in ["flatrate"]:
        for provider in data.get(key, []):
            providers.append({"name":provider["provider_name"], "logo_path":f"{poster_base_url}{provider['logo_path']}"})

    return list(providers)


def get_movie_page(page_num: int):
    url = (
        "https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video="
        f"=false&language=en-US&page={page_num}&sort_by=sort_by=popularity.desc&api_key="
        "612727bdd1150746f832909ef58ac767&with_original_language=en"
    )

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json().get("results", [])

def get_tv_page(page_num: int):
    url = (
        "https://api.themoviedb.org/3/discover/tv?include_adult=false&include_video="
        f"=false&language=en-US&page={page_num}&sort_by=sort_by=popularity.desc&api_key="
        "612727bdd1150746f832909ef58ac767&with_original_language=en"
    )

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json().get("results", [])

def build_movie(result: dict) -> dict:
    poster_path = result.get("poster_path")
    poster_url = f"{poster_base_url}{poster_path}" if poster_path else None
    return {
        "id": result["id"],
        "title": result["title"],
        "overview": result["overview"],
        "poster_path": poster_url,
        "release_date": result.get("release_date"),
        "vote_count": result.get("vote_count"),
        "providers": get_movie_providers(result["id"]),
    }

def build_TV(result: dict) -> dict:
    poster_path = result.get("poster_path")
    poster_url = f"{poster_base_url}{poster_path}" if poster_path else None
    return {
        "id": result["id"],
        "name": result["name"],
        "overview": result["overview"],
        "poster_path": poster_url,
        "first_air_date": result.get("first_air_date"),
        "vote_count": result.get("vote_count"),
        "providers": get_tv_providers(result["id"]),
    }


def fetch_movies(max_movies: int, workers: int = MAX_WORKERS) -> list[dict]:
    movies: list[dict] = []
    next_page = 1
    exhausted = False

    with ThreadPoolExecutor(max_workers=workers) as executor:
        while len(movies) < max_movies and not exhausted:
            batch_pages = range(next_page, next_page + workers)
            futures = {executor.submit(get_movie_page, page): page for page in batch_pages}
            next_page += workers

            results_by_page: dict[int, list[dict]] = {}
            for future in as_completed(futures):
                page_num = futures[future]
                try:
                    results_by_page[page_num] = future.result()
                except Exception as exc:
                    raise RuntimeError(f"Failed to fetch movie page {page_num}") from exc

            for page_num in sorted(results_by_page):
                page_results = results_by_page[page_num]
                if not page_results:
                    exhausted = True
                    continue

                for result in page_results:
                    movie = build_movie(result)
                    release_date = movie.get("release_date")
                    release_year = release_date.split("-")[0] if release_date else None
                    if (
                        release_year
                        and release_year <= "2025"
                        and movie.get("poster_path")
                        and (movie.get("vote_count") or 0) > 700
                    ):
                        movies.append(movie)
                    if len(movies) >= max_movies:
                        break

                print(f"Fetched {len(movies)} movies so far...")

                if len(movies) >= max_movies:
                    break

    return movies[:max_movies]

def fetch_TV(max_TV: int, workers: int = MAX_WORKERS) -> list[dict]:
    series: list[dict] = []
    next_page = 1
    exhausted = False

    with ThreadPoolExecutor(max_workers=workers) as executor:
        while len(series) < max_TV and not exhausted:
            batch_pages = range(next_page, next_page + workers)
            futures = {executor.submit(get_tv_page, page): page for page in batch_pages}
            next_page += workers

            results_by_page: dict[int, list[dict]] = {}
            for future in as_completed(futures):
                page_num = futures[future]
                try:
                    results_by_page[page_num] = future.result()
                except Exception as exc:
                    raise RuntimeError(f"Failed to fetch TV page {page_num}") from exc

            for page_num in sorted(results_by_page):
                page_results = results_by_page[page_num]
                if not page_results:
                    exhausted = True
                    continue

                for result in page_results:
                    tv_show = build_TV(result)
                    first_air = tv_show.get("first_air_date")
                    first_air_year = first_air.split("-")[0] if first_air else None
                    if (
                        first_air_year
                        and first_air_year <= "2025"
                        and tv_show.get("poster_path")
                        and (tv_show.get("vote_count") or 0) > 700
                    ):
                        series.append(tv_show)
                    if len(series) >= max_TV:
                        break

                print(f"Fetched {len(series)} TV shows so far...")

                if len(series) >= max_TV:
                    break

    return series[:max_TV]


if __name__ == "__main__":
    # movies = fetch_movies(MAX_MOVIES)
    # with open("movies.json", "w", encoding="utf-8") as f:
    #     json.dump(movies, f, ensure_ascii=False, indent=2)

    tv_shows = fetch_TV(MAX_TV)
    with open("tv_shows.json", "w", encoding="utf-8") as f:
        json.dump(tv_shows, f, ensure_ascii=False, indent=2)
