import { API_BASE_URL } from '../config/apiConfig.js';

// Reusable API call function with token
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('idToken');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API call failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }

  return response.json();
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

      const isAuthenticated = localStorage.getItem('idToken') !== null;
      const quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1).map(num => `<option value="${num}">${num}</option>`).join('');
      
      productDetails.innerHTML = `
        <div class="product-layout">
          <div class="image-container">
            ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.brand || 'Product'} Image" class="product-image">` : ''}
          </div>
          <div class="details-container">
            <h2>${(data.brand || 'Unknown') + ' ' + (data.modelName || '')}</h2>
            <p><strong>Brand:</strong> ${data.brand || 'Unknown Brand'}</p>
            <p><strong>Price:</strong> $${data.price || 'N/A'}</p>
            ${data.size ? `<p><strong>Size:</strong> ${data.size}"</p>` : ''}
            ${data.resolution ? `<p><strong>Resolution:</strong> ${data.resolution}</p>` : ''}
            ${data.hz ? `<p><strong>Refresh Rate:</strong> ${data.hz}Hz</p>` : ''}
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
            ${isAuthenticated ? `
              <div class="quantity-container">
                <label for="quantity-select">Quantity: </label>
                <select id="quantity-select">${quantityOptions}</select>
              </div>
            ` : `
              <div class="login-prompt">
                <p>Please <a href="#" onclick="login(); return false;">login</a> to add items to cart</p>
              </div>
            `}
          </div>
          ${isAuthenticated ? `
            <div class="button-container">
              <button id="add-to-cart" class="add-to-cart-btn">Add to Cart</button>
            </div>
          ` : ''}
        </div>
      `;
      loadingDiv.style.display = 'none';

      // Add zoom effect based on mouse position
      const image = document.querySelector('.product-image');
      if (image) {
        image.addEventListener('mousemove', (e) => {
          const rect = image.getBoundingClientRect();
          const x = e.clientX - rect.left; // X position within the image
          const y = e.clientY - rect.top;  // Y position within the image
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const offsetX = ((x - centerX) / centerX) * 50; // Adjust zoom origin (-50% to 50%)
          const offsetY = ((y - centerY) / centerY) * 50;
          image.style.transformOrigin = `${50 + offsetX}% ${50 + offsetY}%`;
        });

        image.addEventListener('mouseleave', () => {
          image.style.transformOrigin = 'center'; // Reset to center on mouse leave
        });
      }

      if (isAuthenticated) {
        const addToCartBtn = document.getElementById('add-to-cart');
        addToCartBtn.addEventListener('click', async () => {
          const quantity = parseInt(document.getElementById('quantity-select').value);
          const requestData = {
            productId: productId,
            quantity: quantity,
            category: foundCategory,
            price: data.price || 0
          };
          // Wrap requestData in a products array as expected by the API
          const payload = { products: [requestData] };

          console.log('Attempting to add to cart:', payload);

          try {
            const response = await apiCall('/api/cart', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            console.log('API Response:', response);

            if (response.statusCode === 200 || response.statusCode === 201) {
              const bodyData = response.body ? JSON.parse(response.body) : response;
              if (bodyData.message && bodyData.message.includes('updated')) {
                alert('Item added/updated in cart!');
                updateCartCount();
                const cartButton = document.createElement('a');
                cartButton.href = 'cart.html';
                cartButton.className = 'cart-btn';
                cartButton.textContent = 'Cart';
                document.querySelector('.button-container').appendChild(cartButton);
              } else if (bodyData.message && bodyData.message.includes('added')) {
                alert('Item added to cart!');
                updateCartCount();
                const cartButton = document.createElement('a');
                cartButton.href = 'cart.html';
                cartButton.className = 'cart-btn';
                cartButton.textContent = 'Cart';
                document.querySelector('.button-container').appendChild(cartButton);
              } else {
                alert(`Failed to add item: ${bodyData.message || 'Unknown error'}`);
              }
            } else {
              alert(`Failed to add item: ${response.message || 'Server error'}`);
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

  // Helper function to update the cart count
  async function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    const token = localStorage.getItem('idToken');

    if (token) {
      try {
        const response = await apiCall('/api/cart', {
          method: 'GET'
        });
        const { items = [] } = response; // Assuming the Lambda returns { items: [...] }
        const count = items.length; // Number of unique items
        cartLinks.forEach(link => {
          link.textContent = `Cart (${count})`;
        });
        console.log('Cart count updated to:', count);
      } catch (error) {
        console.error('Error fetching cart count:', error.message);
        cartLinks.forEach(link => {
          link.textContent = `Cart (0)`; // Fallback to 0 on error
        });
      }
    } else {
      cartLinks.forEach(link => {
        link.textContent = `Cart (0)`; // Default to 0 if not authenticated
      });
    }
  }

  if (productId) {
    fetchProduct();
  } else {
    window.location.href = 'error.html';
  }
});