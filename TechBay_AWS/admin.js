import { currentUser, API_URL } from './auth.js';

// Load all products for admin view
async function loadAdminProducts() {
    try {
        const response = await axios.get(`${API_URL}/api/products`);
        const products = response.data;
        const productsTable = document.getElementById('productsTable');
        productsTable.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="border p-2">${product.productId}</td>
                <td class="border p-2">${product.brand} ${product.modelName || ''}</td>
                <td class="border p-2">${product.category}</td>
                <td class="border p-2">$${product.price}</td>
                <td class="border p-2">
                    <button class="delete-product-btn px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" data-id="${product.productId}">Delete</button>
                </td>
            `;
            productsTable.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const productId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this product?')) {
                    try {
                        await axios.delete(`${API_URL}/api/products/${productId}`);
                        loadAdminProducts();
                    } catch (error) {
                        console.error('Error deleting product:', error);
                        alert('Failed to delete product');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products');
    }
}

// Initialize admin functionality
function initAdmin() {
    // Show/hide sections
    document.getElementById('showUsersBtn').addEventListener('click', () => {
        document.getElementById('adminUsers').classList.remove('hidden');
        document.getElementById('adminProducts').classList.add('hidden');
        document.getElementById('addProductForm').classList.add('hidden');
    });
    
    document.getElementById('showProductsBtn').addEventListener('click', () => {
        document.getElementById('adminUsers').classList.add('hidden');
        document.getElementById('adminProducts').classList.remove('hidden');
        document.getElementById('addProductForm').classList.remove('hidden');
        loadAdminProducts();
    });
    
    // Load initial data
    loadAdminProducts();
}

export { initAdmin };