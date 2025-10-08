// watchlist.js
async function addToWatchlist(movie) {
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
      alert('Movie added to your watchlist!');
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

async function removeFromWatchlist(movieId) {
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

async function getUserWatchlist() {
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

function updateWatchlistButton(movieId, isInWatchlist) {
  const button = document.querySelector(`[data-movie-id="${movieId}"]`);
  if (button) {
    if (isInWatchlist) {
      button.textContent = 'Remove from Watchlist';
      button.classList.add('btn--danger');
      button.classList.remove('btn--primary');
    } else {
      button.textContent = 'Add to Watchlist';
      button.classList.add('btn--primary');
      button.classList.remove('btn--danger');
    }
  }
}

async function isMovieInWatchlist(movieId) {
  const watchlist = await getUserWatchlist();
  return watchlist.some(movie => movie.id === movieId);
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
      showWatchlistState('empty');
      return;
    }

    showWatchlistState('content');
    renderWatchlistMovies(watchlist);
  } catch (error) {
    console.error('Error loading watchlist:', error);
    showWatchlistState('empty');
  }
}

function showWatchlistState(state) {
  const states = ['loading', 'empty', 'notLoggedIn', 'content'];
  
  states.forEach(s => {
    const element = document.getElementById(`watchlist${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (element) {
      element.style.display = s === state ? 'block' : 'none';
    }
  });
}

function renderWatchlistMovies(movies) {
  const container = document.getElementById('watchlistContent');
  
  if (!container) return;

  container.innerHTML = '';

  movies.forEach(movie => {
    const movieElement = createWatchlistMovieElement(movie);
    container.appendChild(movieElement);
  });
}

function createWatchlistMovieElement(movie) {
  const movieDiv = document.createElement('div');
  movieDiv.className = 'watchlist-item';

  const addedDate = movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : 'Unknown';
  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

  movieDiv.innerHTML = `
    <div class="watchlist-item__poster">
      <img src="${movie.poster_path || '/placeholder-poster.jpg'}" alt="${movie.title} poster" />
    </div>
    <div class="watchlist-item__content">
      <h3 class="watchlist-item__title">${movie.title}</h3>
      <div class="watchlist-item__year">${year}</div>
      <div class="watchlist-item__overview">${movie.overview || 'No description available.'}</div>
      <div class="watchlist-item__actions">
        <button class="btn btn--remove remove-from-watchlist" data-movie-id="${movie.id}">
          Remove
        </button>
        <span class="watchlist-item__added">Added ${addedDate}</span>
      </div>
    </div>
  `;

  return movieDiv;
}

function getCurrentUser() {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    addToWatchlist,
    removeFromWatchlist,
    getUserWatchlist,
    updateWatchlistButton,
    isMovieInWatchlist,
    displayWatchlist,
    initializeWatchlistPage
  };
}