// Main Application - VAPI Call Tracking Dashboard
import { SUPABASE_CONFIG } from './js/config.js';
import { showToast } from './js/utils.js';

// Initialize Supabase client
const { createClient } = supabase;
window.supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Router
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path) {
    if (this.routes[path]) {
      this.currentRoute = path;
      this.routes[path]();

      // Update active nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.route === path) {
          link.classList.add('active');
        }
      });
    }
  }

  init() {
    // Handle initial route
    const hash = window.location.hash.slice(1) || '/';
    this.navigate(hash);

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash.slice(1) || '/';
      this.navigate(newHash);
    });
  }
}

// Create global router
window.router = new Router();

// Authentication state
let currentUser = null;
let userProfile = null;
let isAdmin = false;

// Check authentication status
async function checkAuth() {
  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (session) {
    currentUser = session.user;

    // Get user profile
    const { data: profile } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    userProfile = profile;

    // Check if user is admin
    const { data: roles } = await window.supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id);

    isAdmin = roles?.some(r => r.role === 'admin') || false;

    return true;
  }

  return false;
}

// Render navigation
function renderNav() {
  const navContainer = document.getElementById('nav');

  if (!currentUser) {
    navContainer.innerHTML = '';
    return;
  }

  navContainer.innerHTML = `
    <nav class="nav">
      <div class="nav-container">
        <a href="#/" class="nav-brand">VAPI Dashboard</a>
        <div class="nav-links">
          <a class="nav-link" data-route="/" href="#/">Dashboard</a>
          <a class="nav-link" data-route="/profile" href="#/profile">Profile</a>
          <a class="nav-link" data-route="/campaigns" href="#/campaigns">Campaigns</a>
          ${isAdmin ? '<a class="nav-link" data-route="/admin" href="#/admin">Admin</a>' : ''}
          <button class="btn btn-logout" onclick="handleLogout()">Logout</button>
        </div>
      </div>
    </nav>
  `;
}

// Logout handler
window.handleLogout = async function () {
  await window.supabaseClient.auth.signOut();
  currentUser = null;
  userProfile = null;
  isAdmin = false;
  window.location.hash = '/login';
  showToast('Logged out successfully', 'success');
};

// Protected route wrapper
async function protectedRoute(handler) {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    window.location.hash = '/login';
    return;
  }

  renderNav();
  handler();
}

// Public route wrapper
async function publicRoute(handler) {
  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    window.location.hash = '/';
    return;
  }

  document.getElementById('nav').innerHTML = '';
  handler();
}

// Register routes (will be imported from separate files)
window.router.register('/login', () => publicRoute(renderLogin));
window.router.register('/signup', () => publicRoute(renderSignup));
window.router.register('/', () => protectedRoute(renderDashboard));
window.router.register('/profile', () => protectedRoute(renderProfile));
window.router.register('/campaigns', () => protectedRoute(renderCampaigns));
window.router.register('/admin', () => protectedRoute(renderAdmin));

// Placeholder render functions (will be replaced by imports)
function renderLogin() {
  document.getElementById('app').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading login page...</p></div>';
}

function renderSignup() {
  document.getElementById('app').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading signup page...</p></div>';
}

function renderDashboard() {
  document.getElementById('app').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading dashboard...</p></div>';
}

function renderProfile() {
  document.getElementById('app').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading profile...</p></div>';
}

function renderAdmin() {
  if (!isAdmin) {
    document.getElementById('app').innerHTML = '<div class="container"><h1>Access Denied</h1><p>You do not have permission to view this page.</p></div>';
    return;
  }
  document.getElementById('app').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading admin panel...</p></div>';
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  window.router.init();
});

// Export for use in other modules
window.appState = {
  getCurrentUser: () => currentUser,
  getUserProfile: () => userProfile,
  isAdmin: () => isAdmin,
  refreshAuth: checkAuth
};
