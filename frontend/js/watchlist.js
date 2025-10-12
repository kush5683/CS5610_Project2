// watchlist.js
export async function addToWatchlist(movie) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please sign in to add movies to your watchlist');
    window.location.href = 'sign-in.html';
    return;
  }

  try {
    const response = await fetch('/api/add-to-user-watchlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: user.id, 
        movie: movie 
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Movie added to watchlist:', movie);
      
      updateWatchlistButton(movie.id, true);
      
      if (window.location.pathname.includes('watchlist.html')) {
        await displayWatchlist();
      }
    } else {
      alert(result.error || 'Failed to add movie to watchlist');
    }
  } catch (error) {
    console.error('Add to watchlist error:', error);
  }
}

export async function removeFromWatchlist(movieId) {
  const user = getCurrentUser();
  if (!user) {
    alert('Please sign in first');
    return;
  }

  try {
    const response = await fetch('/api/remove-from-user-watchlist', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId: user.id, 
        movieId: movieId 
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Movie removed from watchlist:', movieId);
      updateWatchlistButton(movieId, false);
      if (window.location.pathname.includes('watchlist.html')) {
        await displayWatchlist();
      }
    } else {
      console.error('Failed to remove from watchlist:', result.error);
    }
  } catch (error) {
    console.error('Remove from watchlist error:', error);
  }
}

export async function getUserWatchlist() {
  const user = getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const response = await fetch(`/api/get-user-watchlist?userId=${user.id}`);
    const watchlist = await response.json();
    
    if (response.ok) {
      return watchlist;
    } else {
      console.error('Failed to get watchlist:', watchlist.error);
      return [];
    }
  } catch (error) {
    console.error('Get watchlist error:', error);
    return [];
  }
}

export function updateWatchlistButton(movieId, isInWatchlist) {
  const buttons = document.querySelectorAll(`.watchlist-btn[data-movie-id="${movieId}"]`);

  buttons.forEach(button => {
    if (isInWatchlist) {
      button.textContent = 'Remove from Watchlist';
      button.classList.add('btn--danger');
      button.classList.remove('btn--primary');
    } else {
      button.textContent = 'Add to Watchlist';
      button.classList.add('btn--primary');
      button.classList.remove('btn--danger');
    }
  });

  toggleWatchlistCardHighlight(movieId, isInWatchlist);
}

export async function isMovieInWatchlist(movieId) {
  const watchlist = await getUserWatchlist();
  return watchlist.some(movie => movie.id === movieId);
}

const watchlistCarousel = document.getElementById('watchlistCarousel');
const watchlistPrev = document.getElementById('watchlistPrev');
const watchlistNext = document.getElementById('watchlistNext');
const watchlistDots = document.getElementById('watchlistDots');
const watchlistControls = document.getElementById('watchlistControls');
const watchlistViewport = document.getElementById('watchlistViewport');

const watchlistState = {
  movies: [],
  currentSlide: 0,
  itemsPerSlide: 1,
  totalSlides: 0,
  initialized: false,
};

function toggleWatchlistCardHighlight(entityId, shouldHighlight) {
  if (entityId == null) return;

  const highlightClass = 'is-watchlisted';
  const id = String(entityId);
  const selectors = [
    `.movie-card[data-movie-id="${id}"]`,
    `.movie-card[data-series-id="${id}"]`,
    `.series-card[data-series-id="${id}"]`,
    `.top-movie-card[data-movie-id="${id}"]`
  ];

  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(card => {
      if (shouldHighlight) {
        card.classList.add(highlightClass);
      } else {
        card.classList.remove(highlightClass);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  if (window.location.pathname.includes('watchlist.html')) {
    initializeWatchlistPage();
  }

  document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('watchlist-btn')) {
      e.preventDefault();
      console.log('Watchlist button clicked!', e.target);
      
      const movieId = parseInt(e.target.dataset.movieId);
      const movieData = JSON.parse(e.target.dataset.movieData || '{}');
      console.log('Movie data:', { movieId, movieData });
      
      const isInWatchlist = await isMovieInWatchlist(movieId);
      console.log('Is in watchlist:', isInWatchlist);
      
      if (isInWatchlist) {
        await removeFromWatchlist(movieId);
      } else {
        await addToWatchlist(movieData);
      }
    }

    if (e.target.classList.contains('remove-from-watchlist')) {
      e.preventDefault();
      const movieId = parseInt(e.target.dataset.movieId);
      await removeFromWatchlist(movieId);
      await displayWatchlist();
    }
  });
});

async function initializeWatchlistPage() {
  initializeWatchlistCarousel();

  const user = getCurrentUser();
  
  if (!user) {
    showWatchlistState('notLoggedIn');
    return;
  }

  await displayWatchlist();
}

async function displayWatchlist() {
  const user = getCurrentUser();
  
  if (!user) {
    showWatchlistState('notLoggedIn');
    return;
  }

  showWatchlistState('loading');

  try {
    const watchlist = await getUserWatchlist();
    
    if (watchlist.length === 0) {
      watchlistState.movies = [];
      watchlistState.totalSlides = 0;
      if (watchlistCarousel) {
        watchlistCarousel.innerHTML = '';
      }
      if (watchlistDots) {
        watchlistDots.innerHTML = '';
      }
      refreshWatchlistHighlights([]);
      showWatchlistState('empty');
      return;
    }

    const normalizedWatchlist = watchlist.map(normalizeWatchlistEntry);
    watchlistState.movies = normalizedWatchlist;
    watchlistState.currentSlide = 0;
    watchlistState.itemsPerSlide = calculateWatchlistItemsPerSlide();

    showWatchlistState('content');
    renderWatchlistCarousel();
    refreshWatchlistHighlights(normalizedWatchlist);
  } catch (error) {
    console.error('Error loading watchlist:', error);
    showWatchlistState('empty');
  }
}

function showWatchlistState(state) {
  const loadingEl = document.getElementById('watchlistLoading');
  const emptyEl = document.getElementById('watchlistEmpty');
  const notLoggedInEl = document.getElementById('watchlistNotLoggedIn');

  if (loadingEl) {
    loadingEl.hidden = state !== 'loading';
  }
  if (emptyEl) {
    emptyEl.hidden = state !== 'empty';
  }
  if (notLoggedInEl) {
    notLoggedInEl.hidden = state !== 'notLoggedIn';
  }

  const showCarousel = state === 'content';

  if (watchlistViewport) {
    watchlistViewport.hidden = !showCarousel;
  }
  if (watchlistControls) {
    watchlistControls.hidden = !showCarousel;
  }
  if (watchlistDots) {
    watchlistDots.hidden = !showCarousel;
  }
}

function initializeWatchlistCarousel() {
  if (watchlistState.initialized || !watchlistCarousel) {
    return;
  }

  watchlistState.itemsPerSlide = calculateWatchlistItemsPerSlide();
  watchlistState.currentSlide = 0;
  watchlistState.totalSlides = 0;
  watchlistState.initialized = true;

  applyWatchlistLayout();
  watchlistCarousel.style.setProperty("--carousel-offset", "0%");

  watchlistPrev?.addEventListener("click", () => moveWatchlistSlide(-1));
  watchlistNext?.addEventListener("click", () => moveWatchlistSlide(1));
  watchlistDots?.addEventListener("click", handleWatchlistDotClick);
  window.addEventListener("resize", handleWatchlistResize);
}

function renderWatchlistCarousel() {
  if (!watchlistCarousel) {
    return;
  }

  const itemsPerSlide = Math.max(1, watchlistState.itemsPerSlide);
  const movies = watchlistState.movies;

  watchlistCarousel.innerHTML = "";

  if (!movies.length) {
    watchlistState.totalSlides = 0;
    updateWatchlistCarousel({ immediate: true });
    renderWatchlistDots();
    return;
  }

  const paddedMovies = [...movies];
  const remainder = paddedMovies.length % itemsPerSlide;

  if (remainder !== 0) {
    const placeholdersToAdd = itemsPerSlide - remainder;
    for (let i = 0; i < placeholdersToAdd; i += 1) {
      paddedMovies.push(null);
    }
  }

  paddedMovies.forEach(movie => {
    const listItem = document.createElement("li");
    listItem.className = "top-movies__item";

    if (!movie) {
      listItem.innerHTML = `
        <article class="top-movie-card top-movie-card--placeholder" aria-hidden="true"></article>
      `;
    } else {
      listItem.appendChild(createWatchlistCarouselCard(movie));
    }

    watchlistCarousel.appendChild(listItem);
  });

  watchlistState.totalSlides = Math.max(Math.ceil(movies.length / itemsPerSlide), 1);
  watchlistState.currentSlide = Math.min(watchlistState.currentSlide, watchlistState.totalSlides - 1);

  renderWatchlistDots();
  updateWatchlistCarousel({ immediate: true });
}

function createWatchlistCarouselCard(movie) {
  const normalizedMovie = normalizeWatchlistEntry(movie);
  const posterUrl = escapeHtmlValue(
    normalizedMovie.poster_path || "https://via.placeholder.com/500x750?text=No+Poster"
  );
  const rawTitle = normalizedMovie.title || normalizedMovie.name || normalizedMovie.original_title || "Untitled Title";
  const title = escapeHtmlValue(rawTitle);
  const rawYear =
    normalizedMovie.releaseYear ||
    normalizedMovie.release_date ||
    normalizedMovie.first_air_date ||
    normalizedMovie.air_date ||
    "";
  const year = rawYear ? escapeHtmlValue(String(rawYear).split("-")[0]) : "N/A";

  const overviewSource =
    normalizedMovie.overview && normalizedMovie.overview.trim().length > 0
      ? normalizedMovie.overview
      : "No description available.";
  const overview = escapeHtmlValue(overviewSource);

  let addedDateLabel = "Unknown date";
  if (normalizedMovie.addedAt) {
    const parsedDate = new Date(normalizedMovie.addedAt);
    if (!Number.isNaN(parsedDate.valueOf())) {
      addedDateLabel = parsedDate.toLocaleDateString();
    }
  }
  const addedDate = escapeHtmlValue(addedDateLabel);
  const movieIdAttr = escapeHtmlValue(String(normalizedMovie.id));
  const mediaType = deriveMediaType(normalizedMovie);

  const card = document.createElement("article");
  card.className = "top-movie-card watchlist-card";
  card.dataset.movieId = movieIdAttr;
  card.dataset.mediaType = mediaType;
  card.classList.add("is-watchlisted");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View details for ${title}`);

  card.innerHTML = `
    <div class="top-movie-card__poster">
      <img src="${posterUrl}" alt="Poster for ${title}" loading="lazy" />
    </div>
    <div class="watchlist-card__body">
      <h3 class="top-movie-card__title">${title}</h3>
      <p class="top-movie-card__meta">${year}</p>
      <p class="watchlist-card__overview">${overview}</p>
      <div class="watchlist-card__actions">
        <button class="btn btn--ghost watchlist-card__remove remove-from-watchlist" data-movie-id="${movieIdAttr}">
          Remove
        </button>
        <span class="watchlist-card__added">Added ${addedDate}</span>
      </div>
    </div>
  `;

  const handleSelect = () => handleWatchlistCardClick(normalizedMovie);

  card.addEventListener("click", (event) => {
    if (event.target.closest(".remove-from-watchlist")) {
      return;
    }
    handleSelect();
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (event.target.closest(".remove-from-watchlist")) {
        return;
      }
      event.preventDefault();
      handleSelect();
    }
  });

  return card;
}

function handleWatchlistCardClick(movie) {
  if (!movie || typeof window === "undefined") {
    return;
  }

  const mediaType = deriveMediaType(movie);
  const storageKey = mediaType === "series" ? "series:selectedSeries" : "movies:selectedMovie";
  const targetPage = mediaType === "series" ? "series.html" : "movies.html";

  try {
    sessionStorage.setItem(storageKey, JSON.stringify(movie));
    if (mediaType === "series") {
      sessionStorage.removeItem("movies:selectedMovie");
    } else {
      sessionStorage.removeItem("series:selectedSeries");
    }
  } catch (error) {
    console.error("Failed to cache watchlist selection:", error);
  }

  window.location.href = targetPage;
}

function renderWatchlistDots() {
  if (!watchlistDots) {
    return;
  }

  const slideCount = watchlistState.totalSlides;
  watchlistDots.innerHTML = "";

  if (slideCount <= 1) {
    watchlistDots.hidden = true;
    return;
  }

  for (let i = 0; i < slideCount; i += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "top-movies__dot";
    dot.dataset.slide = String(i);
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to watchlist slide ${i + 1}`);

    if (i === watchlistState.currentSlide) {
      dot.classList.add("is-active");
      dot.setAttribute("aria-selected", "true");
    } else {
      dot.setAttribute("aria-selected", "false");
    }

    watchlistDots.appendChild(dot);
  }

  watchlistDots.hidden = slideCount <= 1;
}

function moveWatchlistSlide(direction) {
  if (watchlistState.totalSlides <= 1) {
    return;
  }

  const slideCount = watchlistState.totalSlides;
  watchlistState.currentSlide =
    (watchlistState.currentSlide + direction + slideCount) % slideCount;

  updateWatchlistCarousel();
}

function handleWatchlistDotClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  if (!target.classList.contains("top-movies__dot")) {
    return;
  }

  const slideIndex = Number(target.dataset.slide);
  if (Number.isNaN(slideIndex)) {
    return;
  }

  watchlistState.currentSlide = slideIndex;
  updateWatchlistCarousel();
}

function handleWatchlistResize() {
  if (!watchlistState.initialized || !watchlistCarousel) {
    return;
  }

  const newItemsPerSlide = calculateWatchlistItemsPerSlide();
  if (newItemsPerSlide === watchlistState.itemsPerSlide) {
    return;
  }

  const previousItemsPerSlide = watchlistState.itemsPerSlide;
  const firstVisibleIndex = watchlistState.currentSlide * previousItemsPerSlide;

  watchlistState.itemsPerSlide = newItemsPerSlide;
  applyWatchlistLayout();

  if (!watchlistState.movies.length) {
    watchlistState.currentSlide = 0;
    updateWatchlistCarousel({ immediate: true });
    return;
  }

  watchlistState.currentSlide = Math.floor(firstVisibleIndex / newItemsPerSlide);
  renderWatchlistCarousel();
}

function applyWatchlistLayout() {
  if (!watchlistCarousel) {
    return;
  }

  watchlistCarousel.style.setProperty("--items-per-slide", String(watchlistState.itemsPerSlide));
}

function updateWatchlistCarousel({ immediate = false } = {}) {
  if (!watchlistCarousel) {
    return;
  }

  const slideCount = watchlistState.totalSlides;
  if (!slideCount) {
    watchlistCarousel.style.setProperty("--carousel-offset", "0%");
    watchlistPrev?.setAttribute("disabled", "true");
    watchlistNext?.setAttribute("disabled", "true");
    return;
  }

  watchlistState.currentSlide = Math.max(
    0,
    Math.min(watchlistState.currentSlide, slideCount - 1)
  );

  const offsetValue = `-${watchlistState.currentSlide * 100}%`;

  if (immediate) {
    watchlistCarousel.style.transition = "none";
    requestAnimationFrame(() => {
      watchlistCarousel.style.setProperty("--carousel-offset", offsetValue);
      requestAnimationFrame(() => {
        watchlistCarousel.style.transition = "";
      });
    });
  } else {
    watchlistCarousel.style.setProperty("--carousel-offset", offsetValue);
  }

  applyWatchlistLayout();

  const disableNavigation = slideCount <= 1;
  if (watchlistPrev) {
    watchlistPrev.disabled = disableNavigation;
  }
  if (watchlistNext) {
    watchlistNext.disabled = disableNavigation;
  }

  if (watchlistDots) {
    watchlistDots.hidden = slideCount <= 1;
    Array.from(watchlistDots.children).forEach(dot => {
      if (!(dot instanceof HTMLButtonElement)) {
        return;
      }
      const index = Number(dot.dataset.slide);
      if (index === watchlistState.currentSlide) {
        dot.classList.add("is-active");
        dot.setAttribute("aria-selected", "true");
      } else {
        dot.classList.remove("is-active");
        dot.setAttribute("aria-selected", "false");
      }
    });
  }
}

export async function refreshWatchlistHighlights(providedWatchlist) {
  if (typeof document === "undefined") {
    return;
  }

  const user = getCurrentUser?.();
  if (!user) {
    clearWatchlistHighlights();
    return;
  }

  let watchlistItems = providedWatchlist;

  if (!Array.isArray(watchlistItems)) {
    try {
      watchlistItems = await getUserWatchlist();
    } catch (error) {
      console.error("Failed to refresh watchlist highlights:", error);
      return;
    }
  }

  const normalizedItems = watchlistItems.map(normalizeWatchlistEntry);
  const idSet = new Set(normalizedItems.map(item => String(item.id)));

  document.querySelectorAll(".movie-card[data-movie-id]").forEach(card => {
    const cardId = card.dataset.movieId;
    if (!cardId) return;
    card.classList.toggle("is-watchlisted", idSet.has(cardId));
  });

  document.querySelectorAll(".movie-card[data-series-id], .series-card[data-series-id]").forEach(card => {
    const cardId = card.dataset.seriesId;
    if (!cardId) return;
    card.classList.toggle("is-watchlisted", idSet.has(cardId));
  });
}

function clearWatchlistHighlights() {
  document.querySelectorAll(".movie-card.is-watchlisted, .series-card.is-watchlisted").forEach(card => {
    card.classList.remove("is-watchlisted");
  });
}

function calculateWatchlistItemsPerSlide() {
  const width = window.innerWidth || document.documentElement.clientWidth;
  if (width < 600) return 1;
  if (width < 900) return 1;
  if (width < 1200) return 2;
  return 3;
}

export function normalizeWatchlistEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return entry;
  }

  if (entry.mediaType) {
    return { ...entry };
  }

  return {
    ...entry,
    mediaType: deriveMediaType(entry),
  };
}

export function deriveMediaType(entry) {
  const explicitType = entry.mediaType || entry.media_type || entry.type;
  if (typeof explicitType === "string") {
    const lowered = explicitType.toLowerCase();
    if (lowered === "tv" || lowered === "series" || lowered === "show") {
      return "series";
    }
    if (lowered === "movie" || lowered === "film") {
      return "movie";
    }
  }

  if (entry.first_air_date || entry.number_of_seasons || entry.episode_run_time) {
    return "series";
  }

  if (entry.release_date || entry.runtime !== undefined) {
    return "movie";
  }

  return "movie";
}

function escapeHtmlValue(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getCurrentUser() {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
}
