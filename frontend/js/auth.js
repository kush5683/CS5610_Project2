// frontend/js/auth.js
// Handle user registration
async function handleRegistration(formData) {
  const firstName = formData.get('first_name');
  const lastName = formData.get('last_name');
  const email = formData.get('email');
  const password = formData.get('password');
  const name = `${firstName} ${lastName}`;

  try {
    const response = await fetch('/api/register-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert('Registration successful! Please sign in.');
      window.location.href = 'sign-in.html';
    } else {
      alert(result.error || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('An error occurred during registration');
  }
}

//user login
async function handleLogin(formData) {
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const response = await fetch('/api/auth-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      //store user info in localStorage
      localStorage.setItem('user', JSON.stringify(result.user));

      //change nav bar to show user logged in
      updateNavigationForLogin(result.user);

      alert('Login successful!');
      window.location.href = 'index.html';
    } else {
      alert(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initializeNavigation();

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await handleRegistration(formData);
    });
  }

  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      await handleLogin(formData);
    });
  }
});

//get user from local storage
function getCurrentUser() {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
}

function logout() {
  localStorage.removeItem('user');
  updateNavigationForLogout();
  window.location.href = 'sign-in.html';
}

function updateNavigationForLogin(user) {
  const navActions = document.querySelector('.wtw-nav__actions');
  if (navActions) {
    navActions.innerHTML = `
      <span class="user-greeting">Hello, ${user.name}!</span>
      <button class="btn btn--ghost" onclick="logout()">Logout</button>
    `;
  }
}

function updateNavigationForLogout() {
  const navActions = document.querySelector('.wtw-nav__actions');
  if (navActions) {
    navActions.innerHTML = `
      <a class="btn btn--ghost" href="sign-in.html">Sign In</a>
      <a class="btn btn--primary" href="get-started.html">Get Started</a>
    `;
  }
}

function initializeNavigation() {
  const user = getCurrentUser();
  if (user) {
    updateNavigationForLogin(user);
  } else {
    updateNavigationForLogout();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleRegistration,
    handleLogin,
    getCurrentUser,
    logout,
    updateNavigationForLogin,
    updateNavigationForLogout,
    initializeNavigation
  };
}