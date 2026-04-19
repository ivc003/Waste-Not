// Auth Tab Switching
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');

authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');
    
    // Remove active class from all tabs
    authTabs.forEach(t => t.classList.remove('active'));
    
    // Hide all forms
    authForms.forEach(form => form.classList.remove('active'));
    
    // Add active class to clicked tab
    tab.classList.add('active');
    
    // Show corresponding form
    const formElement = document.getElementById(`${tabName}-tab`);
    if (formElement) {
      formElement.classList.add('active');
    }
  });
});

// Login Form Submission
const loginForm = document.getElementById('login-tab');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value || 'test@example.com';
    const password = document.getElementById('login-password').value || 'password';
    
    const loginData = {
      email: email,
      password: password,
    };
    
    console.log('Login attempt:', loginData);
    
    // For testing purposes - allow login with any email/password or empty fields
    // Create a test user if one doesn't exist
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: email,
      phone: '(555) 123-4567',
      address: {
        street: '123 Main St',
        unit: '',
        city: 'Washington',
        state: 'DC',
        zip: '20001',
        country: 'USA',
      },
      password: password,
    };
    
    authManager.login(testUser);
    alert('Logged in successfully!');
    window.location.href = 'my-account.html';
  });
}

// Sign Up Form Submission
const signupForm = document.getElementById('signup-tab');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Validate password match
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    const signupData = {
      firstName: document.getElementById('signup-firstname').value,
      lastName: document.getElementById('signup-lastname').value,
      email: document.getElementById('signup-email').value,
      phone: document.getElementById('signup-phone').value,
      address: {
        street: document.getElementById('signup-address').value,
        unit: document.getElementById('signup-address2').value,
        city: document.getElementById('signup-city').value,
        state: document.getElementById('signup-state').value,
        zip: document.getElementById('signup-zip').value,
        country: document.getElementById('signup-country').value,
      },
      password: password,
    };
    
    console.log('Sign up attempt:', signupData);
    
    // Store user in localStorage
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
    const userExists = existingUsers.some(u => u.email === signupData.email);
    
    if (userExists) {
      alert('An account with this email already exists!');
      return;
    }
    
    existingUsers.push(signupData);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    
    // Log user in after signup
    authManager.login(signupData);
    alert('Account created successfully!');
    window.location.href = 'my-account.html';
  });
}
