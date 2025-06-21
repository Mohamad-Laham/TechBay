// auth.js - Enhanced for multiple HTML pages
let currentUser = null;

function login(returnPath = null) {
    // Store the intended destination page
    if (returnPath) {
        sessionStorage.setItem('authReturnPath', returnPath);
    } else {
        // Store current page as return path
        sessionStorage.setItem('authReturnPath', window.location.pathname);
    }
    
    // Always redirect to index.html first (your configured redirect URI)
    const authUrl = `https://${config.cognito.domain}/login?` +
        `response_type=code&` +
        `client_id=${config.cognito.clientId}&` +
        `redirect_uri=${encodeURIComponent(config.cognito.redirectUri)}&` +
        `scope=openid+email+profile`;
    
    window.location.href = authUrl;
}

function logout() {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('authReturnPath');
    
    // Redirect to home page
    window.location.href = '/index.html';
}

async function checkAuth() {
    // Check for authorization code in URL (only happens on index.html)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Exchange code for tokens
        await exchangeCodeForTokens(code);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Check if we need to redirect to original intended page
        const returnPath = sessionStorage.getItem('authReturnPath');
        if (returnPath && returnPath !== '/index.html' && returnPath !== window.location.pathname) {
            sessionStorage.removeItem('authReturnPath');
            window.location.href = returnPath;
            return false;
        }
    }
    
    const idToken = localStorage.getItem('idToken');
    
    if (!idToken) {
        return false;
    }
    
    try {
        // Decode JWT token
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        
        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
            logout();
            return false;
        }
        
        currentUser = {
            id: payload.sub,
            email: payload.email,
            groups: payload['cognito:groups'] || [],
            isAdmin: (payload['cognito:groups'] || []).includes('admins')
        };
        
        return true;
    } catch (e) {
        console.error('Invalid token:', e);
        logout();
        return false;
    }
}

async function exchangeCodeForTokens(code) {
    try {
        const response = await fetch(`https://${config.cognito.domain}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: config.cognito.clientId,
                code: code,
                redirect_uri: config.cognito.redirectUri
            })
        });
        
        const data = await response.json();
        
        if (data.id_token) {
            localStorage.setItem('idToken', data.id_token);
            localStorage.setItem('accessToken', data.access_token);
        }
    } catch (error) {
        console.error('Error exchanging code:', error);
    }
}

// Helper function to protect pages
async function protectPage(options = {}) {
    const isAuthenticated = await checkAuth();
    
    if (!isAuthenticated) {
        if (options.redirectToLogin !== false) {
            login();
        }
        return false;
    }
    
    // Check for required permissions
    if (options.requireAdmin && !currentUser.isAdmin) {
        if (options.redirectOnUnauthorized !== false) {
            alert('Access denied. Admin privileges required.');
            window.location.href = '/index.html';
        }
        return false;
    }
    
    return true;
}

// Helper to update user info on any page
function updateUserInfo() {
    const userInfoElements = document.querySelectorAll('[data-user-info]');
    userInfoElements.forEach(element => {
        if (currentUser) {
            element.innerHTML = `
                <span>${currentUser.email}</span>
                ${currentUser.isAdmin ? '<span class="badge">Admin</span>' : ''}
            `;
        }
    });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { login, logout, checkAuth, protectPage, updateUserInfo, currentUser };
}
