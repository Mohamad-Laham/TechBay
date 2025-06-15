import { initAuth } from './auth.js';
import { initUser } from './user.js';
import { initAdmin } from './admin.js';

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initUser();
    
    // Only initialize admin if user is admin
    if (document.getElementById('adminBtn').classList.contains('hidden') === false) {
        initAdmin();
    }
    
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => history.back());
    
    // Home button
    document.getElementById('pageTitle').addEventListener('click', () => {
        document.getElementById('homePage').classList.remove('hidden');
        document.querySelectorAll('main > div:not(#homePage)').forEach(div => div.classList.add('hidden'));
        loadProducts();
    });
});