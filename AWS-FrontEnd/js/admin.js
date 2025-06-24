// admin.js
import { API_BASE_URL } from '../config/apiConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const productTableBody = document.getElementById('product-table-body');
  const loadingDiv = document.getElementById('loading');
  const deleteModal = document.getElementById('delete-modal');
  const cancelDelete = document.getElementById('cancel-delete');
  const confirmDelete = document.getElementById('confirm-delete');
  let selectedProductId = null;

  async function fetchProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error(`Failed to fetch products: ${response.status}`);
      const data = await response.json();
      const products = JSON.parse(data.body);
      console.log('Fetched products:', products); // Debug: Log products
      productTableBody.innerHTML = '';
      products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><button class="show-id-btn" data-id="${product.productId}">Show ID</button><span class="product-id" style="display:none;">${product.productId}</span></td>
          <td>${product.brand || 'N/A'}</td>
          <td>${product.modelName || 'N/A'}</td>
          <td>$${product.price || 'N/A'}</td>
          <td><button class="delete-btn" data-id="${product.productId}">Delete</button></td>
        `;
        productTableBody.appendChild(row);
      });
      loadingDiv.style.display = 'none';
    } catch (err) {
      console.error('Fetch products error:', err);
      window.location.href = 'error.html';
    }
  }

  productTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('show-id-btn')) {
      const idSpan = e.target.nextElementSibling;
      idSpan.style.display = idSpan.style.display === 'none' ? 'inline' : 'none';
      e.target.textContent = idSpan.style.display === 'none' ? 'Show ID' : 'Hide ID';
    } else if (e.target.classList.contains('delete-btn')) {
      selectedProductId = e.target.dataset.id;
      console.log('Selected productId for deletion:', selectedProductId); // Debug: Log productId
      deleteModal.style.display = 'flex';
    }
  });

  cancelDelete.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    selectedProductId = null;
  });

  confirmDelete.addEventListener('click', async () => {
    if (!selectedProductId) {
      console.error('No productId selected');
      return;
    }

    try {
      console.log(`Attempting DELETE for productId: ${selectedProductId}`); // Debug: Log request
      const url = `${API_BASE_URL}/api/products/${selectedProductId}`;
      console.log(`DELETE URL: ${url}`); // Debug: Log URL
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const responseBody = await response.text();
      console.log(`DELETE response: status=${response.status}, headers=${JSON.stringify([...response.headers])}, body=${responseBody}`); // Debug: Log full response

      let data;
      try {
        data = JSON.parse(responseBody);
        if (data.body) {
          data.body = JSON.parse(data.body);
        }
      } catch (e) {
        console.error('Response parse error:', e);
        throw new Error(`Invalid response format: ${e.message}`);
      }

      if (response.status === 200 && data.statusCode === 200) {
        console.log(`Success: Product ${selectedProductId} deleted`, data.body.deletedProduct); // Debug: Log deleted product
        deleteModal.style.display = 'none';
        selectedProductId = null;
        await fetchProducts();
      } else {
        console.error('Error response:', data);
        throw new Error(data.body?.message || `Error ${data.statusCode || response.status}`);
      }
    } catch (err) {
      console.error('Delete product error:', err.message);
      const modalContent = deleteModal.querySelector('.modal-content');
      const existingError = modalContent.querySelector('.error');
      if (existingError) existingError.remove();
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = err.message || 'Failed to delete product';
      modalContent.insertBefore(errorDiv, modalContent.querySelector('p'));
      setTimeout(() => errorDiv.remove(), 5000); // Remove error after 5 seconds
    }
  });

  // Add View Orders button next to Create New Product in admin-header
  const adminHeader = document.querySelector('.admin-header');
  if (adminHeader) {
    const createBtn = adminHeader.querySelector('.create-btn');
    if (createBtn) {
      const ordersButton = document.createElement('a');
      ordersButton.textContent = 'View Orders';
      ordersButton.className = 'view-orders-btn';
      ordersButton.href = 'order.html'; // Using <a> with href for navigation
      adminHeader.insertBefore(ordersButton, createBtn.nextSibling); // Insert after Create New Product
    }
  }

  fetchProducts();
});