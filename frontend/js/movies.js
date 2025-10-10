const moviesGrid = document.getElementById("moviesGrid");
const pageSizeSelect = document.getElementById("pageSizeSelect");
const paginationInfo = document.getElementById("paginationInfo");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const movieModal = document.getElementById("movieModal");
const movieModalClose = document.getElementById("movieModalClose");
const movieDetailPoster = document.getElementById("movieDetailPoster");
const movieDetailTitle = document.getElementById("movieDetailTitle");
const movieDetailReleaseDate = document.getElementById("movieDetailReleaseDate");
const movieDetailDescription = document.getElementById("movieDetailDescription");
const movieDetailProviders = document.getElementById("movieDetailProviders");
const movieDetailActions = document.getElementById("movieDetailActions");

let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let selectedMovieCard = null;
let isModalOpen = false;
let pendingSelectedMovie = null;

const storedSelectedMovieRaw = (() => {
  try {
    return sessionStorage.getItem("movies:selectedMovie");
  } catch {
    return null;
  }
})();

if (storedSelectedMovieRaw) {
  try {
    pendingSelectedMovie = JSON.parse(storedSelectedMovieRaw);
  } catch (error) {
    console.error("Failed to parse stored selected movie:", error);
    try {
      sessionStorage.removeItem("movies:selectedMovie");
    } catch {
      // ignore
    }
  }
}

// Fetch a page of movies from the backend and render them.
async function loadMovies() {
  if (!moviesGrid) return;
  isLoading = true;

  const pageSize = parseInt(pageSizeSelect?.value, 10) || 50;

  renderLoadingState();
  toggleControls(true);

  try {
    const response = await fetch(`/api/movies?page=${currentPage}&pageSize=${pageSize}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    totalPages = Math.max(data.totalPages || 1, 1);
    currentPage = Math.min(Math.max(data.page || 1, 1), totalPages);

    renderMovies(data.movies || []);
    updatePaginationInfo();
  } catch (error) {
    console.error("Error loading movies:", error);
    renderErrorState();
  } finally {
    isLoading = false;
    toggleControls(false);
    updatePaginationInfo();
  }
}

// Show a placeholder while the page fetch is in flight.
function renderLoadingState() {
  moviesGrid.innerHTML = `<p class="text-center">Loading movies...</p>`;
}

// Display a recovery message if the fetch fails.
function renderErrorState() {
  moviesGrid.innerHTML = `<p class="text-center">Unable to load movies right now. Please try again later.</p>`;
  paginationInfo.textContent = "Error";
}

// Render the current page of movies into cards.
function renderMovies(movies) {
  if (!movies.length) {
    moviesGrid.innerHTML = `<p class="text-center">No movies found for this page.</p>`;
    selectedMovieCard = null;
    return;
  }

  moviesGrid.innerHTML = "";
  selectedMovieCard = null;
  const fragment = document.createDocumentFragment();

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";
    card.dataset.movieId = movie.id;

    const posterUrl = movie.poster_path || "https://via.placeholder.com/500x750?text=No+Poster";
    const releaseYear = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
    const movieTitle = movie.title || "Untitled Movie";

    card.innerHTML = `
      <div class="movie-card__poster">
        <img src="${posterUrl}" alt="Poster for ${escapeHtml(movieTitle)}" loading="lazy" />
      </div>
      <div class="movie-card__content">
        <h2 class="movie-card__title">${escapeHtml(movieTitle)}</h2>
        <p class="movie-card__year">${escapeHtml(releaseYear)}</p>
        <p class="movie-card__overview">${escapeHtml(movie.overview || "No overview available.")}</p>
      </div>
    `;

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View details for ${movieTitle}`);

    const handleSelection = () => {
      highlightSelectedCard(card);
      showMovieDetail(movie);
    };

    card.addEventListener("click", handleSelection);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSelection();
      }
    });

    fragment.appendChild(card);
  });

  moviesGrid.appendChild(fragment);
  maybeShowPendingMovie();
  if (typeof refreshWatchlistHighlights === "function") {
    refreshWatchlistHighlights();
  }
}

// Keep the UI pagination summary, visibility, and button states in sync.
function updatePaginationInfo() {
  if (paginationInfo) {
    paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (prevPageBtn) {
    prevPageBtn.hidden = currentPage <= 1;
    prevPageBtn.disabled = isLoading || currentPage <= 1;
  }

  if (nextPageBtn) {
    nextPageBtn.hidden = currentPage >= totalPages;
    nextPageBtn.disabled = isLoading || currentPage >= totalPages;
  }
}

// Enable/disable the various pagination controls during fetches.
function toggleControls(disabled) {
  if (prevPageBtn) {
    prevPageBtn.disabled = disabled || currentPage <= 1;
  }
  if (nextPageBtn) {
    nextPageBtn.disabled = disabled || currentPage >= totalPages;
  }
  if (pageSizeSelect) {
    pageSizeSelect.disabled = disabled;
  }
}

// Escape user-provided strings before injecting into innerHTML.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Reset to the first page when the requested page size changes.
pageSizeSelect?.addEventListener("change", () => {
  currentPage = 1;
  loadMovies();
});

// Step backward through the catalog when the user clicks previous.
prevPageBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    loadMovies();
  }
});

// Advance through the catalog when the user clicks next.
nextPageBtn?.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage += 1;
    loadMovies();
  }
});

// Kick off the initial fetch once the page is ready.
document.addEventListener("DOMContentLoaded", () => {
  loadMovies();
});

// Highlight the active movie card for context.
function highlightSelectedCard(card) {
  if (selectedMovieCard && selectedMovieCard !== card) {
    selectedMovieCard.classList.remove("movie-card--selected");
  }
  selectedMovieCard = card;
  selectedMovieCard.classList.add("movie-card--selected");
}

// Populate the detail panel with the selected movie's information.
function showMovieDetail(movie) {
  if (
    !movieModal ||
    !movieDetailPoster ||
    !movieDetailTitle ||
    !movieDetailReleaseDate ||
    !movieDetailDescription ||
    !movieDetailProviders
  ) {
    return;
  }

  const movieTitle = movie.title || "Untitled Movie";
  const posterUrl = movie.poster_path || "https://via.placeholder.com/500x750?text=No+Poster";

  movieDetailPoster.innerHTML = `<img src="${posterUrl}" alt="Poster for ${escapeHtml(movieTitle)}" />`;
  movieDetailTitle.textContent = movieTitle;
  movieDetailReleaseDate.textContent = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
  movieDetailDescription.textContent = movie.overview || "No overview available.";

  movieDetailProviders.innerHTML = "";
  if (Array.isArray(movie.providers) && movie.providers.length > 0) {
    const providerCount = movie.providers.length;
    movieDetailProviders.dataset.providerCount =
      providerCount > 10 ? "many" : String(providerCount);

    movie.providers.forEach((provider) => {
      const providerImg = document.createElement("img");
      providerImg.src = provider.logo_path;
      providerImg.alt = provider.name;
      providerImg.title = provider.name;
      movieDetailProviders.appendChild(providerImg);
    });
  } else {
    movieDetailProviders.textContent = "No streaming providers listed.";
    delete movieDetailProviders.dataset.providerCount;
  }

  addWatchlistButtonToDetail(movie);
  openMovieModal();
}

// Insert a watchlist button (or prompt) into the detail panel.
function addWatchlistButtonToDetail(movie) {
  if (!movieDetailActions) return;

  movieDetailActions.innerHTML = "";

  if (typeof getCurrentUser !== "function") {
    return;
  }

  const user = getCurrentUser();
  const movieId = movie?.id;

  if (!user) {
    const notice = document.createElement("p");
    notice.className = "movie-detail__signin-note";
    notice.textContent = "Sign in to add this movie to your watchlist.";
    movieDetailActions.appendChild(notice);
    return;
  }

  if (!movieId) {
    const unavailable = document.createElement("p");
    unavailable.className = "movie-detail__signin-note";
    unavailable.textContent = "Watchlist support requires a valid movie identifier.";
    movieDetailActions.appendChild(unavailable);
    return;
  }

  const watchlistBtn = document.createElement("button");
  watchlistBtn.className = "btn btn--primary suggestion-watchlist-btn watchlist-btn";
  watchlistBtn.textContent = "Add to Watchlist";
  watchlistBtn.dataset.movieId = movieId;
  const watchlistPayload = { ...movie, mediaType: "movie" };
  watchlistBtn.dataset.movieData = JSON.stringify(watchlistPayload);

  movieDetailActions.appendChild(watchlistBtn);

  if (typeof isMovieInWatchlist === "function" && typeof updateWatchlistButton === "function") {
    isMovieInWatchlist(movieId)
      .then((isInWatchlist) => {
        updateWatchlistButton(movieId, isInWatchlist);
      })
      .catch((error) => {
        console.error("Failed to check watchlist state:", error);
      });
  }
}

function openMovieModal() {
  if (!movieModal?.classList.contains("is-open")) {
    movieModal.classList.add("is-open");
    movieModal.setAttribute("aria-hidden", "false");
    isModalOpen = true;
    document.body?.classList.add("movie-modal-open");
    document.addEventListener("keydown", handleEscapeKey);
  }
}

function closeMovieModal() {
  if (movieModal?.classList.contains("is-open")) {
    movieModal.classList.remove("is-open");
    movieModal.setAttribute("aria-hidden", "true");
    isModalOpen = false;
    document.body?.classList.remove("movie-modal-open");
    document.removeEventListener("keydown", handleEscapeKey);
  }
}

function handleEscapeKey(event) {
  if (event.key === "Escape") {
    closeMovieModal();
  }
}

movieModalClose?.addEventListener("click", () => {
  closeMovieModal();
});

movieModal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-movie-modal]")) {
    closeMovieModal();
  }
});

function maybeShowPendingMovie() {
  if (!pendingSelectedMovie) return;

  const targetId = pendingSelectedMovie.id;
  if (targetId == null) {
    finalizePendingSelection();
    return;
  }

  const matchingCard = moviesGrid?.querySelector(
    `.movie-card[data-movie-id="${targetId}"]`
  );

  if (matchingCard) {
    highlightSelectedCard(matchingCard);
    showMovieDetail({ ...pendingSelectedMovie });
    finalizePendingSelection();
  } else {
    showMovieDetail({ ...pendingSelectedMovie });
    finalizePendingSelection();
  }
}

function finalizePendingSelection() {
  pendingSelectedMovie = null;
  try {
    sessionStorage.removeItem("movies:selectedMovie");
  } catch {
    // ignore
  }
}
