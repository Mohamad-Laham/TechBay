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
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const products = JSON.parse(data.body);
      productTableBody.innerHTML = '';
      products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${product.productId}</td>
          <td>${product.brand || product.company || 'N/A'}</td>
          <td>$${product.price}</td>
          <td><button class="delete-btn" data-id="${product.productId}">Delete</button></td>
        `;
        productTableBody.appendChild(row);
      });
      loadingDiv.style.display = 'none';
    } catch (err) {
      console.error(err);
      window.location.href = 'error.html';
    }
  }

  productTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
      selectedProductId = e.target.dataset.id;
      deleteModal.style.display = 'flex';
    }
  });

  cancelDelete.addEventListener('click', () => {
    deleteModal.style.display = 'none';
    selectedProductId = null;
  });

  confirmDelete.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${selectedProductId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      deleteModal.style.display = 'none';
      selectedProductId = null;
      fetchProducts();
    } catch (err) {
      console.error(err);
      window.location.href = 'error.html';
    }
  });

  fetchProducts();
});
