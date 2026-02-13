// Authentication Pages - Login and Signup
import { showToast } from './utils.js';

// Render Login Page
export function renderLogin() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Welcome Back</h1>
        <p class="auth-subtitle">Sign in to your VAPI dashboard</p>
        
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="you@example.com">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
        </form>
        
        <p class="text-center mt-3">
          Don't have an account? <a href="#/signup" class="auth-link">Sign up</a>
        </p>
      </div>
    </div>
  `;

  // Handle form submission
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  showToast('Login successful!', 'success');
  window.location.hash = '/';
}

// Render Signup Page
export function renderSignup() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Get started with VAPI call tracking</p>
        
        <form id="signup-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required placeholder="you@example.com">
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" minlength="6">
          </div>
          
          <div class="form-group">
            <label for="display_name">Display Name</label>
            <input type="text" id="display_name" name="display_name" placeholder="Your Name">
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
        </form>
        
        <p class="text-center mt-3">
          Already have an account? <a href="#/login" class="auth-link">Sign in</a>
        </p>
      </div>
    </div>
  `;

  // Handle form submission
  document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

// Handle Signup
async function handleSignup(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const displayName = document.getElementById('display_name').value;

  const { data, error } = await window.supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    showToast(error.message, 'error');
    return;
  }

  showToast('Account created successfully! Please sign in.', 'success');
  window.location.hash = '/login';
}
