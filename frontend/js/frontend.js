console.log("Frontend JS loaded successfully.");

// Event listener for random movie button
document
  .getElementById("generateSuggestionBtn")
  .addEventListener("click", async () => {
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
      
      if (suggestion.providers && suggestion.providers.length > 0) {
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

      // Smooth scroll to result
      requestAnimationFrame(() => {
        resultContainer.scrollIntoView({ behavior: "smooth", block: "center" });
      });
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
  const existingBtn = document.querySelector('.suggestion-watchlist-btn');
  if (existingBtn) {
    existingBtn.remove();
  }

  // Create watchlist button
  const watchlistBtn = document.createElement('button');
  watchlistBtn.className = 'btn btn--primary suggestion-watchlist-btn watchlist-btn';
  watchlistBtn.textContent = 'Add to Watchlist';
  watchlistBtn.dataset.movieId = movie.id;
  watchlistBtn.dataset.movieData = JSON.stringify(movie);

  // Add button to the result container
  const resultContainer = document.getElementById("suggestionResult");
  resultContainer.appendChild(watchlistBtn);
}

// Get current user from localStorage
function getCurrentUser() {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
}
