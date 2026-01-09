(function() {
  function hasValidToken() {
    var token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return false;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      var now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return false;
      return true;
    } catch (e) { return false; }
  }

  function getUserFromToken() {
    var token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return null;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.userId, username: payload.username, email: payload.email, role: payload.role || 'free', subscription_tier: payload.subscription_tier || 'free' };
    } catch (e) { return null; }
  }

  async function waitForAuth(ms) {
    var start = Date.now();
    while (Date.now() - start < ms) {
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn) return true;
      await new Promise(function(r) { setTimeout(r, 50); });
    }
    return false;
  }

  async function isLoggedIn() {
    if (await waitForAuth(1500)) return Auth.isLoggedIn();
    return hasValidToken();
  }

  async function getCurrentUser() {
    if (await waitForAuth(1500) && Auth.getCurrentUser) return Auth.getCurrentUser();
    return getUserFromToken();
  }

  async function requireLogin(redirectTo) {
    if (!(await isLoggedIn())) { window.location.href = redirectTo || '/login'; return null; }
    return await getCurrentUser();
  }

  async function requireAdmin(redirectTo) {
    var user = await requireLogin('/login');
    if (!user) return null;
    if (user.role !== 'admin') { window.location.href = redirectTo || '/dashboard'; return null; }
    return user;
  }

  window.AuthHelper = { isLoggedIn: isLoggedIn, getCurrentUser: getCurrentUser, requireLogin: requireLogin, requireAdmin: requireAdmin, hasValidToken: hasValidToken, getUserFromToken: getUserFromToken };
})();
