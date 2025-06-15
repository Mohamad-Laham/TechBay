import { currentUser, API_URL } from './auth.js';

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Load products for user view
async function loadProducts(category = 'all') {
    try {
        const response = await axios.get(`${API_URL}/api/products`);
        const products = response.data;
        const productsGrid = document.getElementById('productsGrid');
        productsGrid.innerHTML = '';

        const filteredProducts = category === 'all' ? products : products.filter(p => p.category === category);
        
        filteredProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded shadow cursor-pointer';
            card.innerHTML = `
                <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.brand}" class="w-full h-48 object-cover mb-2">
                <h3 class="text-lg font-bold">${product.brand} ${product.modelName || ''}</h3>
                <p class="text-gray-600">$${product.price}</p>
            `;
            card.addEventListener('click', () => showProductDetails(product));
            productsGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    }
}

// Show product details
async function showProductDetails(product) {
    // ... (same as your existing product details code)
}

// Initialize user functionality
function initUser() {
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => loadProducts(btn.dataset.category));
    });
    
    // Profile button
    document.getElementById('profileBtn').addEventListener('click', showUserProfile);
    
    // Load initial products
    loadProducts();
}

export { loadProducts, initUser };