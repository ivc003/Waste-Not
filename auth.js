// Authentication state management
class AuthManager {
  constructor() {
    this.isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    this.updateAuthButton();
  }

  login(userData) {
    this.isLoggedIn = true;
    this.currentUser = userData;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(userData));
    this.updateAuthButton();
  }

  logout() {
    this.isLoggedIn = false;
    this.currentUser = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    this.updateAuthButton();
  }

  updateAuthButton() {
    const authButtons = document.querySelectorAll('#auth-button');
    authButtons.forEach(button => {
      if (this.isLoggedIn) {
        button.textContent = 'My Account';
        button.href = 'my-account.html';
        button.classList.add('logged-in');
      } else {
        button.textContent = 'Login';
        button.href = 'login.html';
        button.classList.remove('logged-in');
      }
    });
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Update auth button when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    authManager.updateAuthButton();
  });
} else {
  // DOM is already loaded
  authManager.updateAuthButton();
}
