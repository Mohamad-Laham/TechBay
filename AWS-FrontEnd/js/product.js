import { API_BASE_URL } from '../config/apiConfig.js';

// Helper function to make authenticated API calls (optional auth)
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...(idToken ? { 'Authorization': idToken } : {}),
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const productDetails = document.getElementById('product-details');
  const loadingDiv = document.getElementById('loading');
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const categories = ['phone', 'tablet', 'television', 'headphone', 'PC Screen', 'PC', 'laptop'];

  async function fetchProduct() {
    let foundCategory = urlParams.get('category');
    let data = null;

    try {
      if (!productId) throw new Error('Product ID is missing');

      if (foundCategory && categories.includes(foundCategory)) {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}?category=${foundCategory}`);
        if (response.ok) {
          const responseData = await response.json();
          data = JSON.parse(responseData.body);
          if (data && data.productId) foundCategory = data.category;
        }
      }

      if (!data || !data.productId) {
        for (const category of categories) {
          const response = await fetch(`${API_BASE_URL}/api/products/${productId}?category=${category}`);
          if (response.ok) {
            const responseData = await response.json();
            data = JSON.parse(responseData.body);
            if (data && data.productId) {
              foundCategory = category;
              break;
            }
          }
        }
      }

      if (!data || !data.productId) {
        throw new Error('Product not found');
      }

      // Check if user is authenticated
      const isAuthenticated = localStorage.getItem('idToken') !== null;

      const quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1).map(num => `<option value="${num}">${num}</option>`).join('');
      productDetails.innerHTML = `
        <h2>${(data.brand || 'Unknown') + ' ' + (data.modelName || '')}</h2>
        ${data.size ? `<p><strong>Size:</strong> ${data.size}"</p>` : ''}
        ${data.hz ? `<p><strong>Refresh Rate:</strong> ${data.hz}Hz</p>` : ''}
        ${data.resolution ? `<p><strong>Resolution:</strong> ${data.resolution}</p>` : ''}
        ${data.aspectRatio ? `<p><strong>Aspect Ratio:</strong> ${data.aspectRatio}</p>` : ''}
        ${data.memoryStorageCapacity ? `<p><strong>Storage:</strong> ${data.memoryStorageCapacity}GB</p>` : ''}
        ${data.ram ? `<p><strong>RAM:</strong> ${data.ram}GB</p>` : ''}
        ${data.displayResolutionMaximum ? `<p><strong>Display Resolution:</strong> ${data.displayResolutionMaximum}</p>` : ''}
        ${data.color ? `<p><strong>Color:</strong> ${data.color}</p>` : ''}
        ${data.motherboardCompatibility ? `<p><strong>Motherboard:</strong> ${data.motherboardCompatibility}</p>` : ''}
        ${data.recommendedUses ? `<p><strong>Recommended Use:</strong> ${data.recommendedUses}</p>` : ''}
        ${data.memorySize ? `<p><strong>Memory:</strong> ${data.memorySize}GB</p>` : ''}
        ${data.ssd ? `<p><strong>SSD:</strong> ${data.ssd}GB</p>` : ''}
        ${data.graphicsCard ? `<p><strong>Graphics Card:</strong> ${data.graphicsCard}</p>` : ''}
        ${data.processor ? `<p><strong>Processor:</strong> ${data.processor}</p>` : ''}
        ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
        <p><strong>Price:</strong> $${data.price || 'N/A'}</p>
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.brand || 'Product'} Image" class="product-image">` : ''}
        ${isAuthenticated ? `
          <div class="quantity-container">
            <label for="quantity-select">Quantity: </label>
            <select id="quantity-select">${quantityOptions}</select>
          </div>
          <div class="button-container" id="button-container"></div>
        ` : `
          <div class="login-prompt">
            <p>Please <a href="#" onclick="login(); return false;">login</a> to add items to cart</p>
          </div>
        `}
      `;
      loadingDiv.style.display = 'none';

      if (isAuthenticated) {
        const buttonContainer = document.getElementById('button-container');
        const addToCartBtn = document.createElement('button');
        addToCartBtn.id = 'add-to-cart';
        addToCartBtn.className = 'add-to-cart-btn';
        addToCartBtn.textContent = 'Add to Cart';
        buttonContainer.appendChild(addToCartBtn);

        addToCartBtn.addEventListener('click', async () => {
          const quantity = parseInt(document.getElementById('quantity-select').value);
          const requestData = { body: JSON.stringify({ productId, quantity, category: foundCategory }) };
          console.log('Attempting to add to cart:', requestData);

          try {
            const response = await authenticatedFetch('https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/cart', {
              method: 'POST',
              body: JSON.stringify(requestData)
            });
            const data = await response.json();
            console.log('API Response:', data);
            
            if (response.status === 401) {
              alert('Your session has expired. Please login again.');
              login();
              return;
            }
            
            if (data.statusCode === 200) {
              const bodyData = JSON.parse(data.body);
              console.log('Parsed Body:', bodyData);
              if (bodyData.success) {
                alert('Item added to cart!');
                updateCartCount();
                const cartButton = document.createElement('a');
                cartButton.href = 'cart.html';
                cartButton.className = 'cart-btn';
                cartButton.textContent = 'Cart';
                buttonContainer.appendChild(cartButton);
              } else {
                alert(`Failed to add item: ${bodyData.message || 'Unknown error'}`);
              }
            } else {
              const bodyData = JSON.parse(data.body);
              console.log('Error Body:', bodyData);
              alert(`Failed to add item: ${bodyData.message || 'Server error'}`);
            }
          } catch (error) {
            console.error('Error adding to cart:', error.message);
            alert('An error occurred while adding to cart. Check console for details.');
          }
        });
      }

      updateCartCount();
    } catch (err) {
      console.error('Error fetching product:', err.message);
      window.location.href = 'error.html';
    }
  }

  function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    cartLinks.forEach(link => {
      link.textContent = `Cart (0)`;
    });
  }

  if (productId) {
    fetchProduct();
  } else {
    window.location.href = 'error.html';
  }
});
