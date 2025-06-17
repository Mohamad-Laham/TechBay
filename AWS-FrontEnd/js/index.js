import { API_BASE_URL } from '../config/apiConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const productsDiv = document.getElementById('products');
  const loadingDiv = document.getElementById('loading');

  async function fetchProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const products = JSON.parse(data.body);
      if (!Array.isArray(products)) throw new Error('Unexpected response format');

      productsDiv.innerHTML = '';
      products.forEach(product => {
        const card = document.createElement('a');
        card.href = `product.html?id=${product.productId}`;
        card.className = 'product-card';
        card.innerHTML = `
          <h3>${product.brand || product.company || 'Unknown'}</h3>
          <p>Price: $${product.price}</p>
          ${product.size ? `<p>Size: ${product.size}"</p>` : ''}
          ${product.hz ? `<p>Refresh Rate: ${product.hz}Hz</p>` : ''}
          ${product.resolution ? `<p>Resolution: ${product.resolution}</p>` : ''}
        `;
        productsDiv.appendChild(card);
      });
      loadingDiv.style.display = 'none';
    } catch (err) {
      window.location.href = 'error.html';
    }
  }

  fetchProducts();
});