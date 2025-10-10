const seriesGrid = document.getElementById("seriesGrid");
const pageSizeSelect = document.getElementById("seriesPageSizeSelect");
const paginationInfo = document.getElementById("seriesPaginationInfo");
const prevPageBtn = document.getElementById("seriesPrevPageBtn");
const nextPageBtn = document.getElementById("seriesNextPageBtn");
const seriesModal = document.getElementById("seriesModal");
const seriesModalClose = document.getElementById("seriesModalClose");
const seriesDetailPoster = document.getElementById("seriesDetailPoster");
const seriesDetailTitle = document.getElementById("seriesDetailTitle");
const seriesDetailReleaseDate = document.getElementById("seriesDetailReleaseDate");
const seriesDetailDescription = document.getElementById("seriesDetailDescription");
const seriesDetailProviders = document.getElementById("seriesDetailProviders");
const seriesDetailActions = document.getElementById("seriesDetailActions");

let currentPage = 1;
let totalPages = 1;
let isLoading = false;
let selectedSeriesCard = null;
let isModalOpen = false;
let pendingSelectedSeries = null;

const storedSelectedSeriesRaw = (() => {
  try {
    return sessionStorage.getItem("series:selectedSeries");
  } catch {
    return null;
  }
})();

if (storedSelectedSeriesRaw) {
  try {
    pendingSelectedSeries = JSON.parse(storedSelectedSeriesRaw);
  } catch (error) {
    console.error("Failed to parse stored selected series:", error);
    try {
      sessionStorage.removeItem("series:selectedSeries");
    } catch {
      // ignore
    }
  }
}

async function loadSeries() {
  if (!seriesGrid) return;
  isLoading = true;

  const pageSize = parseInt(pageSizeSelect?.value, 10) || 50;

  renderLoadingState();
  toggleControls(true);

  try {
    const response = await fetch(`/api/series?page=${currentPage}&pageSize=${pageSize}`);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    totalPages = Math.max(data.totalPages || 1, 1);
    currentPage = Math.min(Math.max(data.page || 1, 1), totalPages);

    const normalizedSeries = (data.series || []).map(normalizeSeries);

    renderSeries(normalizedSeries);
    updatePaginationInfo();
  } catch (error) {
    console.error("Error loading series:", error);
    renderErrorState();
  } finally {
    isLoading = false;
    toggleControls(false);
    updatePaginationInfo();
  }
}

function renderLoadingState() {
  seriesGrid.innerHTML = `<p class="text-center">Loading series...</p>`;
}

function renderErrorState() {
  seriesGrid.innerHTML = `<p class="text-center">Unable to load series right now. Please try again later.</p>`;
  if (paginationInfo) {
    paginationInfo.textContent = "Error";
  }
}

function renderSeries(series) {
  if (!series.length) {
    seriesGrid.innerHTML = `<p class="text-center">No series found for this page.</p>`;
    selectedSeriesCard = null;
    return;
  }

  seriesGrid.innerHTML = "";
  selectedSeriesCard = null;
  const fragment = document.createDocumentFragment();

  series.forEach((show) => {
    const card = document.createElement("article");
    card.className = "movie-card series-card";
    card.dataset.seriesId = show.id;

    const posterUrl = show.poster_path || "https://via.placeholder.com/500x750?text=No+Poster";
    const releaseYear = show.releaseYear || "N/A";
    const showTitle = show.title;

    card.innerHTML = `
      <div class="movie-card__poster">
        <img src="${posterUrl}" alt="Poster for ${escapeHtml(showTitle)}" loading="lazy" />
      </div>
      <div class="movie-card__content">
        <h2 class="movie-card__title">${escapeHtml(showTitle)}</h2>
        <p class="movie-card__year">${escapeHtml(releaseYear)}</p>
        <p class="movie-card__overview">${escapeHtml(show.overview || "No overview available.")}</p>
      </div>
    `;

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `View details for ${showTitle}`);

    const handleSelection = () => {
      highlightSelectedCard(card);
      showSeriesDetail(show);
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

  seriesGrid.appendChild(fragment);
  maybeShowPendingSeries();
}

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

pageSizeSelect?.addEventListener("change", () => {
  currentPage = 1;
  loadSeries();
});

prevPageBtn?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    loadSeries();
  }
});

nextPageBtn?.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage += 1;
    loadSeries();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadSeries();
});

function highlightSelectedCard(card) {
  if (selectedSeriesCard && selectedSeriesCard !== card) {
    selectedSeriesCard.classList.remove("movie-card--selected");
  }
  selectedSeriesCard = card;
  selectedSeriesCard.classList.add("movie-card--selected");
}

function showSeriesDetail(show) {
  if (
    !seriesModal ||
    !seriesDetailPoster ||
    !seriesDetailTitle ||
    !seriesDetailReleaseDate ||
    !seriesDetailDescription ||
    !seriesDetailProviders
  ) {
    return;
  }

  const showTitle = show.title;
  const posterUrl = show.poster_path || "https://via.placeholder.com/500x750?text=No+Poster";

  seriesDetailPoster.innerHTML = `<img src="${posterUrl}" alt="Poster for ${escapeHtml(showTitle)}" />`;
  seriesDetailTitle.textContent = showTitle;
  seriesDetailReleaseDate.textContent = show.releaseYear || "N/A";
  seriesDetailDescription.textContent = show.overview || "No overview available.";

  seriesDetailProviders.innerHTML = "";
  if (Array.isArray(show.providers) && show.providers.length > 0) {
    seriesDetailProviders.dataset.providerCount = show.providers.length > 10 ? "many" : String(show.providers.length);
    show.providers.forEach((provider) => {
      const providerImg = document.createElement("img");
      providerImg.src = provider.logo_path;
      providerImg.alt = provider.name;
      providerImg.title = provider.name;
      seriesDetailProviders.appendChild(providerImg);
    });
  } else {
    delete seriesDetailProviders.dataset.providerCount;
    seriesDetailProviders.textContent = "No streaming providers listed.";
  }

  addWatchlistButtonToDetail(show);
  openSeriesModal();
}

function addWatchlistButtonToDetail(show) {
  if (!seriesDetailActions) return;

  seriesDetailActions.innerHTML = "";

  if (typeof getCurrentUser !== "function") {
    return;
  }

  const user = getCurrentUser();
  const showId = show?.id;

  if (!user) {
    const notice = document.createElement("p");
    notice.className = "movie-detail__signin-note";
    notice.textContent = "Sign in to add this series to your watchlist.";
    seriesDetailActions.appendChild(notice);
    return;
  }

  if (!showId) {
    const unavailable = document.createElement("p");
    unavailable.className = "movie-detail__signin-note";
    unavailable.textContent = "Watchlist support requires a valid series identifier.";
    seriesDetailActions.appendChild(unavailable);
    return;
  }

  const watchlistBtn = document.createElement("button");
  watchlistBtn.className = "btn btn--primary suggestion-watchlist-btn watchlist-btn";
  watchlistBtn.textContent = "Add to Watchlist";
  watchlistBtn.dataset.movieId = showId;
  watchlistBtn.dataset.movieData = JSON.stringify(show);

  seriesDetailActions.appendChild(watchlistBtn);

  if (typeof isMovieInWatchlist === "function" && typeof updateWatchlistButton === "function") {
    isMovieInWatchlist(showId)
      .then((isInWatchlist) => {
        updateWatchlistButton(showId, isInWatchlist);
      })
      .catch((error) => {
        console.error("Failed to check watchlist state:", error);
      });
  }
}

function openSeriesModal() {
  if (!seriesModal?.classList.contains("is-open")) {
    seriesModal.classList.add("is-open");
    seriesModal.setAttribute("aria-hidden", "false");
    isModalOpen = true;
    document.body?.classList.add("movie-modal-open");
    document.addEventListener("keydown", handleEscapeKey);
  }
}

function closeSeriesModal() {
  if (seriesModal?.classList.contains("is-open")) {
    seriesModal.classList.remove("is-open");
    seriesModal.setAttribute("aria-hidden", "true");
    isModalOpen = false;
    document.body?.classList.remove("movie-modal-open");
    document.removeEventListener("keydown", handleEscapeKey);
  }
}

function handleEscapeKey(event) {
  if (event.key === "Escape") {
    closeSeriesModal();
  }
}

seriesModalClose?.addEventListener("click", () => {
  closeSeriesModal();
});

seriesModal?.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-series-modal]")) {
    closeSeriesModal();
  }
});

function maybeShowPendingSeries() {
  if (!pendingSelectedSeries) return;

  const targetId = pendingSelectedSeries.id;
  if (targetId == null) {
    finalizePendingSelection();
    return;
  }

  const matchingCard = seriesGrid?.querySelector(
    `.series-card[data-series-id="${targetId}"]`
  );

  if (matchingCard) {
    highlightSelectedCard(matchingCard);
    showSeriesDetail({ ...pendingSelectedSeries });
    finalizePendingSelection();
  } else {
    showSeriesDetail({ ...pendingSelectedSeries });
    finalizePendingSelection();
  }
}

function finalizePendingSelection() {
  pendingSelectedSeries = null;
  try {
    sessionStorage.removeItem("series:selectedSeries");
  } catch {
    // ignore
  }
}

function normalizeSeries(rawSeries) {
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
