// AWS Cognito Configuration
const REGION = 'us-east-1';
const USER_POOL_ID = 'YOUR_USER_POOL_ID';
const CLIENT_ID = 'YOUR_CLIENT_ID';
const API_URL = 'https://0dx54dy3ce.execute-api.us-east-1.amazonaws.com/prod';

AWS.config.region = REGION;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'YOUR_IDENTITY_POOL_ID'
});

const userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
    UserPoolId: USER_POOL_ID,
    ClientId: CLIENT_ID
});

let currentUser = userPool.getCurrentUser();

// Update UI based on authentication state
function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    const profileBtn = document.getElementById('profileBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    if (currentUser) {
        authBtn.textContent = 'Logout';
        profileBtn.classList.remove('hidden');
        
        // Check if user is admin
        currentUser.getSession((err, session) => {
            if (err) return;
            const groups = session.getIdToken().payload['cognito:groups'] || [];
            if (groups.includes('Admin')) {
                adminBtn.classList.remove('hidden');
            }
        });
    } else {
        authBtn.textContent = 'Login';
        profileBtn.classList.add('hidden');
        adminBtn.classList.add('hidden');
    }
}

// Initialize authentication
function initAuth() {
    const authBtn = document.getElementById('authBtn');
    
    authBtn.addEventListener('click', () => {
        if (currentUser) {
            // Logout
            currentUser.signOut();
            currentUser = null;
            localStorage.removeItem('cart');
            updateAuthUI();
            window.location.reload();
        } else {
            // Login
            window.location.href = `https://${USER_POOL_ID}.auth.${REGION}.amazoncognito.com/login?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${window.location.origin}`;
        }
    });
    
    updateAuthUI();
}

export { currentUser, userPool, API_URL, initAuth, updateAuthUI };