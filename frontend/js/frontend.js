import { getCurrentUser } from "./watchlist.js";

console.log("Frontend JS loaded successfully.");

const suggestionBtn = document.getElementById("generateSuggestionBtn");

// Event listener for random movie button
suggestionBtn?.addEventListener("click", async () => {
  console.log("Generate Suggestion button clicked.");
  let resultContainer = document.getElementById("suggestionResult");
  resultContainer.hidden = false;
  let resultPoster = document.getElementById("suggestionPoster");
  let resultTitle = document.getElementById("suggestionTitle");
  let resultReleaseDate = document.getElementById("suggestionReleaseDate");
  let resultDescription = document.getElementById("suggestionDescription");
  let resultProviders = document.getElementById("suggestionProviders");

  try {
    let suggestion = await fetch("/api/get-random-movie").then((response) =>
      response.json(),
    );

    resultPoster.innerHTML = `<img src="${suggestion.poster_path}" alt="Poster Image" />`;
    resultTitle.textContent = suggestion.title;
    resultReleaseDate.textContent = suggestion.release_date.split("-")[0];
    resultDescription.textContent = suggestion.overview;

    resultProviders.innerHTML = "";
    delete resultProviders.dataset.providerCount;

    if (suggestion.providers && suggestion.providers.length > 0) {
      const providerCount = suggestion.providers.length;
      resultProviders.dataset.providerCount =
        providerCount > 10 ? "many" : String(providerCount);
      suggestion.providers.forEach((provider) => {
        let img = document.createElement("img");
        img.src = provider.logo_path;
        img.alt = provider.name;
        img.title = provider.name;
        resultProviders.appendChild(img);
      });
    }

    // Add watchlist button if user is logged in
    addWatchlistButtonToSuggestion(suggestion);
  } catch (error) {
    console.error("Error fetching random movie:", error);
    alert("Failed to get movie suggestion. Please try again.");
  }
});

// Function to add watchlist button to movie suggestion
function addWatchlistButtonToSuggestion(movie) {
  const user = getCurrentUser();
  if (!user) return; // Don't show button if not logged in

  // Remove existing watchlist button
  const existingBtn = document.querySelector(".suggestion-watchlist-btn");
  if (existingBtn) {
    existingBtn.remove();
  }

  // Create watchlist button
  const watchlistBtn = document.createElement("button");
  watchlistBtn.className =
    "btn btn--primary suggestion-watchlist-btn watchlist-btn";
  watchlistBtn.textContent = "Add to Watchlist";
  watchlistBtn.dataset.movieId = movie.id;
  const watchlistPayload = { ...movie, mediaType: "movie" };
  watchlistBtn.dataset.movieData = JSON.stringify(watchlistPayload);

  // Add button to the result container
  const resultContainer = document.getElementById("suggestionResult");
  resultContainer.appendChild(watchlistBtn);
}

// Top movies carousel setup
const topMoviesCarousel = document.getElementById("topMoviesCarousel");
const topMoviesPrev = document.getElementById("topMoviesPrev");
const topMoviesNext = document.getElementById("topMoviesNext");
const topMoviesDots = document.getElementById("topMoviesDots");

const topMoviesState = {
  movies: [],
  extendedMovies: [],
  currentSlide: 0,
  itemsPerSlide: 4,
  visualIndex: 0,
};

if (topMoviesCarousel) {
  initializeTopMoviesCarousel();
}

const topSeriesCarousel = document.getElementById("topSeriesCarousel");
const topSeriesPrev = document.getElementById("topSeriesPrev");
const topSeriesNext = document.getElementById("topSeriesNext");
const topSeriesDots = document.getElementById("topSeriesDots");

const topSeriesState = {
  series: [],
  extendedSeries: [],
  currentSlide: 0,
  itemsPerSlide: 4,
  visualIndex: 0,
};

if (topSeriesCarousel) {
  initializeTopSeriesCarousel();
}

function handleTopMovieSelect(movie) {
  if (!movie) return;
  try {
    sessionStorage.setItem("movies:selectedMovie", JSON.stringify(movie));
  } catch (error) {
    console.error("Failed to cache selected movie:", error);
  }
  window.location.href = "movies.html";
}

function prepareTopMoviesExtendedData({ preserveSlide = false } = {}) {
  const movies = topMoviesState.movies;
  const baseSlides = getTopMoviesSlideCount();

  if (!movies.length) {
    topMoviesState.extendedMovies = [];
    topMoviesState.currentSlide = 0;
    topMoviesState.visualIndex = 0;
    return;
  }

  if (!preserveSlide) {
    topMoviesState.currentSlide = 0;
  } else if (baseSlides > 0) {
    topMoviesState.currentSlide = Math.min(
      topMoviesState.currentSlide,
      baseSlides - 1,
    );
  } else {
    topMoviesState.currentSlide = 0;
  }

  if (baseSlides <= 1) {
    topMoviesState.extendedMovies = [...movies];
    topMoviesState.visualIndex = 0;
    return;
  }

  const groupSize = topMoviesState.itemsPerSlide;
  const slides = [];

  for (let i = 0; i < movies.length; i += groupSize) {
    const slice = movies.slice(i, i + groupSize);
    while (slice.length < groupSize) {
      slice.push(null);
    }
    slides.push(slice);
  }

  const headSlide = slides[0].slice();
  const tailSlide = slides[slides.length - 1].slice();

  topMoviesState.extendedMovies = [
    ...tailSlide,
    ...slides.flat(),
    ...headSlide,
  ];
  topMoviesState.visualIndex = topMoviesState.currentSlide + 1;
}

function initializeTopMoviesCarousel() {
  topMoviesState.itemsPerSlide = calculateTopMoviesItemsPerSlide();
  applyTopMoviesLayout();
  topMoviesPrev?.setAttribute("disabled", "true");
  topMoviesNext?.setAttribute("disabled", "true");
  loadTopMoviesCarousel();

  topMoviesCarousel?.addEventListener(
    "transitionend",
    handleTopMoviesTransitionEnd,
  );
  topMoviesPrev?.addEventListener("click", () => moveTopMoviesSlide(-1));
  topMoviesNext?.addEventListener("click", () => moveTopMoviesSlide(1));
  topMoviesDots?.addEventListener("click", handleTopMoviesDotClick);
  window.addEventListener("resize", handleTopMoviesResize);
}

async function loadTopMoviesCarousel() {
  try {
    const response = await fetch("/api/movies?page=1&pageSize=50");

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    topMoviesState.movies = (data.movies || []).slice(0, 15);
    topMoviesState.currentSlide = 0;

    if (topMoviesState.movies.length === 0) {
      renderTopMoviesEmpty("No movies available right now.");
      return;
    }

    prepareTopMoviesExtendedData();
    renderTopMovies();
    updateTopMoviesCarousel({ immediate: true });
  } catch (error) {
    console.error("Error loading top movies:", error);
    renderTopMoviesEmpty("Unable to load top movies right now.");
  }
}

function renderTopMovies() {
  topMoviesCarousel.innerHTML = "";
  const items = topMoviesState.extendedMovies.length
    ? topMoviesState.extendedMovies
    : topMoviesState.movies;

  items.forEach((movie) => {
    const item = document.createElement("li");
    item.className = "top-movies__item";

    if (!movie) {
      item.innerHTML = `
        <article class="top-movie-card top-movie-card--placeholder" aria-hidden="true"></article>
      `;
      topMoviesCarousel.appendChild(item);
      return;
    }

    const posterUrl =
      movie.poster_path || "https://via.placeholder.com/500x750?text=No+Poster";
    const title = escapeHtml(movie.title || "Untitled Movie");
    const releaseYear = movie.release_date
      ? escapeHtml(movie.release_date.split("-")[0])
      : "N/A";

    item.innerHTML = `
      <article class="top-movie-card">
        <div class="top-movie-card__poster">
          <img src="${posterUrl}" alt="Poster for ${title}" loading="lazy" />
        </div>
        <h3 class="top-movie-card__title">${title}</h3>
        <p class="top-movie-card__meta">${releaseYear}</p>
      </article>
    `;

    const card = item.querySelector(".top-movie-card");
    card.dataset.movieId = movie.id;
    card.addEventListener("click", () => handleTopMovieSelect(movie));

    topMoviesCarousel.appendChild(item);
  });

  renderTopMoviesDots();
  applyTopMoviesLayout();
}

function renderTopMoviesDots() {
  if (!topMoviesDots) return;

  const slideCount = getTopMoviesSlideCount();
  topMoviesDots.innerHTML = "";
  topMoviesDots.hidden = slideCount <= 1;

  for (let i = 0; i < slideCount; i += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "top-movies__dot";
    dot.dataset.slideIndex = String(i);
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.setAttribute(
      "aria-selected",
      i === topMoviesState.currentSlide ? "true" : "false",
    );
    topMoviesDots.appendChild(dot);
  }
}

function renderTopMoviesEmpty(message) {
  topMoviesState.movies = [];
  topMoviesState.extendedMovies = [];
  topMoviesState.currentSlide = 0;
  topMoviesState.visualIndex = 0;
  topMoviesCarousel.innerHTML = `
    <li class="top-movies__item top-movies__item--message">
      <p class="top-movies__message">${escapeHtml(message)}</p>
    </li>
  `;
  topMoviesCarousel.style.setProperty("--items-per-slide", 1);
  topMoviesCarousel.style.setProperty("--carousel-offset", "0%");
  topMoviesPrev?.setAttribute("disabled", "true");
  topMoviesNext?.setAttribute("disabled", "true");
  if (topMoviesDots) {
    topMoviesDots.hidden = true;
    topMoviesDots.innerHTML = "";
  }
}

function moveTopMoviesSlide(direction) {
  const slideCount = getTopMoviesSlideCount();
  if (slideCount <= 1 || !topMoviesState.extendedMovies.length) return;

  topMoviesState.visualIndex += direction;

  const normalized =
    (((topMoviesState.visualIndex - 1) % slideCount) + slideCount) % slideCount;
  topMoviesState.currentSlide = normalized;

  updateTopMoviesCarousel();
}

function handleTopMoviesDotClick(event) {
  const target = event.target.closest("button[data-slide-index]");
  if (!target) return;
  const index = Number.parseInt(target.dataset.slideIndex || "0", 10);
  const slideCount = getTopMoviesSlideCount();
  if (!Number.isNaN(index) && slideCount > 0) {
    topMoviesState.currentSlide = Math.min(index, slideCount - 1);
    topMoviesState.visualIndex =
      slideCount > 1
        ? topMoviesState.currentSlide + 1
        : topMoviesState.currentSlide;
    updateTopMoviesCarousel();
  }
}

function handleTopMoviesResize() {
  const newItemsPerSlide = calculateTopMoviesItemsPerSlide();
  if (newItemsPerSlide !== topMoviesState.itemsPerSlide) {
    topMoviesState.itemsPerSlide = newItemsPerSlide;
    applyTopMoviesLayout();
    if (!topMoviesState.movies.length) {
      updateTopMoviesCarousel({ immediate: true });
      return;
    }
    prepareTopMoviesExtendedData({ preserveSlide: true });
    renderTopMovies();
    updateTopMoviesCarousel({ immediate: true });
  }
}

function applyTopMoviesLayout() {
  topMoviesCarousel?.style.setProperty(
    "--items-per-slide",
    String(topMoviesState.itemsPerSlide),
  );
}

function handleTopMoviesTransitionEnd(event) {
  if (!topMoviesCarousel || event.target !== topMoviesCarousel) return;
  if (event.propertyName !== "transform") return;
  const slideCount = getTopMoviesSlideCount();
  if (slideCount <= 1) return;

  if (topMoviesState.visualIndex === 0) {
    topMoviesState.visualIndex = slideCount;
    topMoviesState.currentSlide = slideCount - 1;
    updateTopMoviesCarousel({ immediate: true });
  } else if (topMoviesState.visualIndex === slideCount + 1) {
    topMoviesState.visualIndex = 1;
    topMoviesState.currentSlide = 0;
    updateTopMoviesCarousel({ immediate: true });
  }
}

function updateTopMoviesCarousel({ immediate = false } = {}) {
  const slideCount = getTopMoviesSlideCount();
  if (slideCount > 0) {
    topMoviesState.currentSlide = Math.max(
      Math.min(topMoviesState.currentSlide, slideCount - 1),
      0,
    );
  } else {
    topMoviesState.currentSlide = 0;
  }

  const usesLooping =
    slideCount > 1 && topMoviesState.extendedMovies.length > 0;

  if (usesLooping) {
    topMoviesState.visualIndex = Math.max(
      Math.min(topMoviesState.visualIndex, slideCount + 1),
      0,
    );
  } else {
    topMoviesState.visualIndex = topMoviesState.currentSlide;
  }

  if (topMoviesCarousel) {
    if (immediate) {
      topMoviesCarousel.style.transition = "none";
    }

    const offsetIndex = usesLooping
      ? topMoviesState.visualIndex
      : topMoviesState.currentSlide;

    const setOffset = () => {
      topMoviesCarousel.style.setProperty(
        "--carousel-offset",
        `-${offsetIndex * 100}%`,
      );

      if (immediate) {
        requestAnimationFrame(() => {
          topMoviesCarousel.style.transition = "";
        });
      }
    };

    if (immediate) {
      requestAnimationFrame(setOffset);
    } else {
      setOffset();
    }
  }

  const disableNavigation = slideCount <= 1;

  if (topMoviesPrev) {
    topMoviesPrev.disabled = disableNavigation;
  }
  if (topMoviesNext) {
    topMoviesNext.disabled = disableNavigation;
  }

  if (topMoviesDots) {
    Array.from(topMoviesDots.children).forEach((dot, index) => {
      const button = dot;
      if (button instanceof HTMLButtonElement) {
        if (index === topMoviesState.currentSlide) {
          button.classList.add("is-active");
          button.setAttribute("aria-selected", "true");
        } else {
          button.classList.remove("is-active");
          button.setAttribute("aria-selected", "false");
        }
      }
    });
  }
}

function calculateTopMoviesItemsPerSlide() {
  const width = window.innerWidth || document.documentElement.clientWidth;
  if (width < 600) return 1;
  if (width < 900) return 2;
  if (width < 1200) return 3;
  return 5;
}

function getTopMoviesSlideCount() {
  if (!topMoviesState.movies.length) return 0;
  return Math.ceil(topMoviesState.movies.length / topMoviesState.itemsPerSlide);
}

function handleTopSeriesSelect(series) {
  if (!series) return;
  try {
    sessionStorage.setItem("series:selectedSeries", JSON.stringify(series));
  } catch (error) {
    console.error("Failed to cache selected series:", error);
  }
  window.location.href = "series.html";
}

function prepareTopSeriesExtendedData({ preserveSlide = false } = {}) {
  const shows = topSeriesState.series;
  const baseSlides = getTopSeriesSlideCount();

  if (!shows.length) {
    topSeriesState.extendedSeries = [];
    topSeriesState.currentSlide = 0;
    topSeriesState.visualIndex = 0;
    return;
  }

  if (!preserveSlide) {
    topSeriesState.currentSlide = 0;
  } else if (baseSlides > 0) {
    topSeriesState.currentSlide = Math.min(
      topSeriesState.currentSlide,
      baseSlides - 1,
    );
  } else {
    topSeriesState.currentSlide = 0;
  }

  if (baseSlides <= 1) {
    topSeriesState.extendedSeries = [...shows];
    topSeriesState.visualIndex = 0;
    return;
  }

  const groupSize = topSeriesState.itemsPerSlide;
  const slides = [];

  for (let i = 0; i < shows.length; i += groupSize) {
    const slice = shows.slice(i, i + groupSize);
    while (slice.length < groupSize) {
      slice.push(null);
    }
    slides.push(slice);
  }

  const headSlide = slides[0].slice();
  const tailSlide = slides[slides.length - 1].slice();

  topSeriesState.extendedSeries = [
    ...tailSlide,
    ...slides.flat(),
    ...headSlide,
  ];
  topSeriesState.visualIndex = topSeriesState.currentSlide + 1;
}

function initializeTopSeriesCarousel() {
  topSeriesState.itemsPerSlide = calculateTopSeriesItemsPerSlide();
  applyTopSeriesLayout();
  loadTopSeriesCarousel();

  topSeriesCarousel?.addEventListener(
    "transitionend",
    handleTopSeriesTransitionEnd,
  );
  topSeriesPrev?.addEventListener("click", () => moveTopSeriesSlide(-1));
  topSeriesNext?.addEventListener("click", () => moveTopSeriesSlide(1));
  topSeriesDots?.addEventListener("click", handleTopSeriesDotClick);
  window.addEventListener("resize", handleTopSeriesResize);
}

async function loadTopSeriesCarousel() {
  try {
    const response = await fetch("/api/series?page=1&pageSize=50");

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    topSeriesState.series = (data.series || [])
      .slice(0, 15)
      .map(normalizeSeriesForCarousel);

    topSeriesState.currentSlide = 0;
    prepareTopSeriesExtendedData();

    if (!topSeriesState.series.length) {
      renderTopSeriesEmpty("No series available right now.");
      return;
    }

    renderTopSeries(
      topSeriesState.extendedSeries.length
        ? topSeriesState.extendedSeries
        : topSeriesState.series,
    );
    updateTopSeriesCarousel({ immediate: true });
  } catch (error) {
    console.error("Error loading top series:", error);
    renderTopSeriesEmpty("Unable to load top series right now.");
  }
}

function renderTopSeries(seriesItems) {
  topSeriesCarousel.innerHTML = "";
  if (!seriesItems.length) {
    renderTopSeriesEmpty("No series available right now.");
    return;
  }

  const fragment = document.createDocumentFragment();

  seriesItems.forEach((show) => {
    const item = document.createElement("li");
    item.className = "top-movies__item";

    if (!show) {
      item.innerHTML = `
        <article class="top-movie-card top-movie-card--placeholder" aria-hidden="true"></article>
      `;
      fragment.appendChild(item);
      return;
    }

    const posterUrl =
      show.poster_path || "https://via.placeholder.com/500x750?text=No+Poster";
    const title = escapeHtml(show.title || "Untitled Series");
    const releaseYear = escapeHtml(show.releaseYear || "N/A");
    const ratingValue = Number(show.vote_average);
    const rating = Number.isFinite(ratingValue)
      ? ratingValue.toFixed(1)
      : "N/A";

    item.innerHTML = `
      <article class="top-movie-card">
        <div class="top-movie-card__poster">
          <img src="${posterUrl}" alt="Poster for ${title}" loading="lazy" />
        </div>
        <h3 class="top-movie-card__title">${title}</h3>
        <p class="top-movie-card__meta">${releaseYear} &bull; ⭐ ${rating}</p>
      </article>
    `;

    const card = item.querySelector(".top-movie-card");
    card.dataset.seriesId = show.id;
    card.addEventListener("click", () => handleTopSeriesSelect(show));

    fragment.appendChild(item);
  });

  topSeriesCarousel.appendChild(fragment);
  renderTopSeriesDots();
  applyTopSeriesLayout();
}

function renderTopSeriesDots() {
  if (!topSeriesDots) return;

  const slideCount = getTopSeriesSlideCount();
  topSeriesDots.innerHTML = "";
  topSeriesDots.hidden = slideCount <= 1;

  for (let i = 0; i < slideCount; i += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "top-movies__dot";
    dot.dataset.slideIndex = String(i);
    dot.setAttribute("aria-label", `Go to series slide ${i + 1}`);
    dot.setAttribute(
      "aria-selected",
      i === topSeriesState.currentSlide ? "true" : "false",
    );
    topSeriesDots.appendChild(dot);
  }
}

function renderTopSeriesEmpty(message) {
  topSeriesState.series = [];
  topSeriesState.extendedSeries = [];
  topSeriesState.currentSlide = 0;
  topSeriesState.visualIndex = 0;
  topSeriesCarousel.innerHTML = `
    <li class="top-movies__item top-movies__item--message">
      <p class="top-movies__message">${escapeHtml(message)}</p>
    </li>
  `;
  topSeriesCarousel.style.setProperty("--items-per-slide", 1);
  topSeriesCarousel.style.setProperty("--carousel-offset", "0%");
  topSeriesPrev?.setAttribute("disabled", "true");
  topSeriesNext?.setAttribute("disabled", "true");
  if (topSeriesDots) {
    topSeriesDots.hidden = true;
    topSeriesDots.innerHTML = "";
  }
}

function moveTopSeriesSlide(direction) {
  const slideCount = getTopSeriesSlideCount();
  if (slideCount <= 1 || !topSeriesState.extendedSeries.length) return;

  topSeriesState.visualIndex += direction;

  const normalized =
    (((topSeriesState.visualIndex - 1) % slideCount) + slideCount) % slideCount;
  topSeriesState.currentSlide = normalized;

  updateTopSeriesCarousel();
}

function handleTopSeriesDotClick(event) {
  const target = event.target.closest("button[data-slide-index]");
  if (!target) return;
  const index = Number.parseInt(target.dataset.slideIndex || "0", 10);
  const slideCount = getTopSeriesSlideCount();
  if (!Number.isNaN(index) && slideCount > 0) {
    topSeriesState.currentSlide = Math.min(index, slideCount - 1);
    topSeriesState.visualIndex =
      slideCount > 1
        ? topSeriesState.currentSlide + 1
        : topSeriesState.currentSlide;
    updateTopSeriesCarousel();
  }
}

function handleTopSeriesResize() {
  const newItemsPerSlide = calculateTopSeriesItemsPerSlide();
  if (newItemsPerSlide !== topSeriesState.itemsPerSlide) {
    topSeriesState.itemsPerSlide = newItemsPerSlide;
    applyTopSeriesLayout();
    if (!topSeriesState.series.length) {
      updateTopSeriesCarousel({ immediate: true });
      return;
    }
    prepareTopSeriesExtendedData({ preserveSlide: true });
    renderTopSeries(
      topSeriesState.extendedSeries.length
        ? topSeriesState.extendedSeries
        : topSeriesState.series,
    );
    updateTopSeriesCarousel({ immediate: true });
  }
}

function applyTopSeriesLayout() {
  topSeriesCarousel?.style.setProperty(
    "--items-per-slide",
    String(topSeriesState.itemsPerSlide),
  );
}

function handleTopSeriesTransitionEnd(event) {
  if (!topSeriesCarousel || event.target !== topSeriesCarousel) return;
  if (event.propertyName !== "transform") return;
  const slideCount = getTopSeriesSlideCount();
  if (slideCount <= 1) return;

  if (topSeriesState.visualIndex === 0) {
    topSeriesState.visualIndex = slideCount;
    topSeriesState.currentSlide = slideCount - 1;
    updateTopSeriesCarousel({ immediate: true });
  } else if (topSeriesState.visualIndex === slideCount + 1) {
    topSeriesState.visualIndex = 1;
    topSeriesState.currentSlide = 0;
    updateTopSeriesCarousel({ immediate: true });
  }
}

function updateTopSeriesCarousel({ immediate = false } = {}) {
  const slideCount = getTopSeriesSlideCount();
  if (slideCount > 0) {
    topSeriesState.currentSlide = Math.max(
      Math.min(topSeriesState.currentSlide, slideCount - 1),
      0,
    );
  } else {
    topSeriesState.currentSlide = 0;
  }

  const usesLooping =
    slideCount > 1 && topSeriesState.extendedSeries.length > 0;

  if (usesLooping) {
    topSeriesState.visualIndex = Math.max(
      Math.min(topSeriesState.visualIndex, slideCount + 1),
      0,
    );
  } else {
    topSeriesState.visualIndex = topSeriesState.currentSlide;
  }

  if (topSeriesCarousel) {
    if (immediate) {
      topSeriesCarousel.style.transition = "none";
    }

    const offsetIndex = usesLooping
      ? topSeriesState.visualIndex
      : topSeriesState.currentSlide;

    const setOffset = () => {
      topSeriesCarousel.style.setProperty(
        "--carousel-offset",
        `-${offsetIndex * 100}%`,
      );

      if (immediate) {
        requestAnimationFrame(() => {
          topSeriesCarousel.style.transition = "";
        });
      }
    };

    if (immediate) {
      requestAnimationFrame(setOffset);
    } else {
      setOffset();
    }
  }

  const disableNavigation = slideCount <= 1;

  if (topSeriesPrev) {
    topSeriesPrev.disabled = disableNavigation;
  }
  if (topSeriesNext) {
    topSeriesNext.disabled = disableNavigation;
  }

  if (topSeriesDots) {
    Array.from(topSeriesDots.children).forEach((dot, index) => {
      const button = dot;
      if (button instanceof HTMLButtonElement) {
        if (index === topSeriesState.currentSlide) {
          button.classList.add("is-active");
          button.setAttribute("aria-selected", "true");
        } else {
          button.classList.remove("is-active");
          button.setAttribute("aria-selected", "false");
        }
      }
    });
  }
}

function calculateTopSeriesItemsPerSlide() {
  const width = window.innerWidth || document.documentElement.clientWidth;
  if (width < 600) return 1;
  if (width < 900) return 2;
  if (width < 1200) return 3;
  return 5;
}

function getTopSeriesSlideCount() {
  if (!topSeriesState.series.length) return 0;
  return Math.ceil(topSeriesState.series.length / topSeriesState.itemsPerSlide);
}

function normalizeSeriesForCarousel(rawSeries) {
  const title = rawSeries.title || rawSeries.name || "Untitled Series";
  const releaseYear = rawSeries.first_air_date
    ? rawSeries.first_air_date.split("-")[0]
    : rawSeries.release_date
      ? rawSeries.release_date.split("-")[0]
      : "N/A";

  return {
    ...rawSeries,
    title,
    releaseYear,
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
