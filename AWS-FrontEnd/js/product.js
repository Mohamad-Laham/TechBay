import { API_BASE_URL } from '../config/apiConfig.js';

document.addEventListener('DOMContentLoaded', () => {
  const productDetails = document.getElementById('product-details');
  const loadingDiv = document.getElementById('loading');
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  async function fetchProduct() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      const product = JSON.parse(data.body);
      productDetails.innerHTML = `
        <h2>${product.brand || product.company || 'Unknown Product'}</h2>
        ${product.size ? `<p><strong>Size:</strong> ${product.size}"</p>` : ''}
        ${product.hz ? `<p><strong>Refresh Rate:</strong> ${product.hz}Hz</p>` : ''}
        ${product.resolution ? `<p><strong>Resolution:</strong> ${product.resolution}</p>` : ''}
        ${product.aspectRatio ? `<p><strong>Aspect Ratio:</strong> ${product.aspectRatio}</p>` : ''}
        ${product.description ? `<p><strong>Description:</strong> ${product.description}</p>` : ''}
        <p><strong>Price:</strong> $${product.price}</p>
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="Product">` : ''}
      `;
      loadingDiv.style.display = 'none';
    } catch (err) {
      window.location.href = 'error.html';
    }
  }

  if (productId) {
    fetchProduct();
  } else {
    window.location.href = 'error.html';
  }
});