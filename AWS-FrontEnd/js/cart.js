import { API_BASE_URL } from '../config/apiConfig.js';

console.log('cart.js loaded');

export async function fetchCartItems() {
  console.log('fetchCartItems called');
  const cartItemsDiv = document.getElementById('cart-items');
  const idToken = localStorage.getItem('idToken');

  // Debug the token
  if (idToken) {
    console.log('Using idToken:', idToken.substring(0, 20) + '...');
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expiration (exp):', new Date(payload.exp * 1000).toISOString(), 'vs Current Time:', new Date().toISOString());
    } catch (e) {
      console.error('Failed to decode token:', e.message);
    }
  } else {
    console.error('No idToken found in localStorage');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET', 
      headers: {
        'Authorization': `Bearer ${idToken}`, // Ensure Authorization header is sent
        'Content-Type': 'application/json',
      }
    });
    const data = await response.json();
    console.log('Raw API Response:', data);

    const { items = [], userInfo = {} } = data; // Destructure items and userInfo from Lambda response
    console.log('Cart items fetched:', items);
    console.log('User info:', userInfo);

    cartItemsDiv.innerHTML = '';
    if (items.length === 0) {
      cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
      updateCartCount(0);
    } else {
      const categories = ['phone', 'tablet', 'television', 'headphone', 'PC Screen', 'PC', 'laptop'];

      const itemPromises = items.map(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';

        return (async () => {
          let productData = null;
          let foundCategory = item.category.toLowerCase().replace(/s$/, '');

          try {
            if (foundCategory && categories.includes(foundCategory)) {
              const productResponse = await fetch(`${API_BASE_URL}/api/products/${item.productId}?category=${foundCategory}`, {
                headers: {
                  'Authorization': `Bearer ${idToken}`, // Ensure Authorization header is sent
                  'Content-Type': 'application/json'
                }
              });
              const productDataRaw = await productResponse.json();
              productData = JSON.parse(productDataRaw.body);
              if (productData && productData.productId) foundCategory = productData.category;
            }

            if (!productData || !productData.productId) {
              for (const category of categories) {
                const productResponse = await fetch(`${API_BASE_URL}/api/products/${item.productId}?category=${category}`, {
                  headers: {
                    'Authorization': `Bearer ${idToken}`, // Ensure Authorization header is sent
                    'Content-Type': 'application/json'
                  }
                });
                const productDataRaw = await productResponse.json();
                productData = JSON.parse(productDataRaw.body);
                if (productData && productData.productId) {
                  foundCategory = category;
                  break;
                }
              }
            }

            if (!productData || !productData.productId) {
              throw new Error(`Product ${item.productId} not found`);
            }

            const pricePerUnit = productData.price || 0;
            const finalPrice = pricePerUnit * item.quantity;

            itemDiv.innerHTML = `
              <img src="${productData.imageUrl || 'placeholder.jpg'}" alt="${productData.brand || 'Product'} Image" class="cart-item-image">
              <div class="cart-item-details">
                <h3>${productData.brand || 'Unknown Product'}</h3>
                <p>Price: $${pricePerUnit.toFixed(2)}</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Final price: $${finalPrice.toFixed(2)}</p>
              </div>
              <button class="remove-from-cart-btn" data-product-id="${item.productId}">Remove</button>
            `;
            cartItemsDiv.appendChild(itemDiv);
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error.message);
            itemDiv.innerHTML = `
              <div class="cart-item-details">
                <h3>Unknown Product - ${item.productId}</h3>
                <p>Price: $0.00</p>
                <p>Quantity: ${item.quantity}</p>
                <p>Final price: $0.00</p>
              </div>
              <button class="remove-from-cart-btn" data-product-id="${item.productId}">Remove</button>
            `;
            cartItemsDiv.appendChild(itemDiv);
          }
        })();
      });

      await Promise.all(itemPromises);

      document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
          console.log('Button clicked');
          const productId = e.target.dataset.productId;
          const requestData = {
            productId: productId
          };
          console.log('Attempting to remove from cart with body:', JSON.stringify(requestData));

          try {
            const response = await fetch(`${API_BASE_URL}/api/cart`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${idToken}`, // Ensure Authorization header is sent
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestData)
            });
            const data = await response.json();
            console.log('Remove API Response:', data);

            if (data.statusCode === 200) {
              const bodyData = data.body ? JSON.parse(data.body) : data;
              if (bodyData.message && bodyData.message.includes('removed')) {
                alert('Item removed from cart!');
                await fetchCartItems();
                calculateTotal();
              } else {
                alert(`Failed to remove item: ${bodyData.message || 'Unknown error'}`);
              }
            } else {
              const bodyData = data.body ? JSON.parse(data.body) : data;
              alert(`Failed to remove item: ${bodyData.message || 'Server error'}`);
            }
          } catch (error) {
            console.error('Error removing from cart:', error.message);
            alert('An error occurred while removing from cart. Check console for details.');
          }
        });
      });

      updateCartCount(items.length);
      calculateTotal();
    }
  } catch (error) {
    console.error('Error fetching cart items:', error.message);
    if (error.message === 'Not authenticated') {
      console.log('Redirecting to index.html due to authentication failure');
      window.location.href = 'index.html';
    } else {
      cartItemsDiv.innerHTML = `<p>Failed to load cart items. Please try again later or check console for details. Error: ${error.message}</p>`;
    }
    updateCartCount(0);
    calculateTotal();
  }
}

export function calculateTotal() {
  console.log('calculateTotal called');
  const cartItemsDiv = document.getElementById('cart-items');
  const cartTotalDiv = document.getElementById('cart-total');
  console.log('cartTotalDiv:', cartTotalDiv);

  let total = 0;
  const items = cartItemsDiv.querySelectorAll('.cart-item');
  if (items.length === 0) {
    cartTotalDiv.innerHTML = '<strong>Total: $0.00</strong><button id="checkout-btn" class="checkout-btn">Checkout</button>';
  } else {
    items.forEach(item => {
      const priceText = item.querySelector('p:nth-child(2)').textContent;
      const quantityText = item.querySelector('p:nth-child(3)').textContent;
      const price = parseFloat(priceText.replace('Price: $', '').replace(',', '')) || 0;
      const quantity = parseInt(quantityText.replace('Quantity: ', '')) || 0;
      total += price * quantity;
    });

    const existingStrong = cartTotalDiv.querySelector('strong');
    if (existingStrong) {
      existingStrong.textContent = `Total: $${total.toFixed(2)}`;
    } else {
      cartTotalDiv.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong><button id="checkout-btn" class="checkout-btn">Checkout</button>`;
    }
  }

  // Add event listener for the checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      console.log('Checkout button clicked, navigating to checkout.html');
      window.location.href = 'checkout.html';
    });
  }

  console.log('cartTotalDiv after update:', cartTotalDiv.innerHTML);
}

// Helper function to update the cart count in the header
function updateCartCount(count) {
  const cartLinks = document.querySelectorAll('.cart-btn');
  cartLinks.forEach(link => {
    link.textContent = `Cart (${count})`;
  });
  console.log('Cart count updated to:', count);
}

// Page load logic
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM fully loaded');
  let isAuthenticated = false;
  try {
    const auth = await import('../js/auth.js');
    if (auth.default && typeof auth.default.protectPage === 'function') {
      isAuthenticated = await auth.default.protectPage();
    } else {
      isAuthenticated = !!localStorage.getItem('idToken'); // Fallback
      console.log('Falling back to localStorage, isAuthenticated:', isAuthenticated);
    }
  } catch (error) {
    console.error('Failed to load auth.js for protectPage:', error);
    isAuthenticated = !!localStorage.getItem('idToken'); // Fallback if import fails
    console.log('Import failed, falling back to localStorage, isAuthenticated:', isAuthenticated);
  }

  if (isAuthenticated) {
    try {
      const auth = await import('../js/auth.js');
      if (auth.default && typeof auth.default.updateUserInfo === 'function') {
        auth.default.updateUserInfo();
      }
    } catch (error) {
      console.error('Failed to load auth.js for updateUserInfo:', error);
    }

    // Access currentUser globally since it's not a named export
    if (window.currentUser && window.currentUser.isAdmin) {
      const authSection = document.getElementById('auth-section');
      const adminLink = document.createElement('a');
      adminLink.href = 'admin.html';
      adminLink.className = 'admin-link';
      adminLink.textContent = 'Admin Panel';
      authSection.insertBefore(adminLink, authSection.firstChild.nextSibling);
    }

    await fetchCartItems();
    calculateTotal();
  } else {
    console.log('Not authenticated, showing login prompt or redirecting');
    const cartItemsDiv = document.getElementById('cart-items');
    cartItemsDiv.innerHTML = '<p>Please log in to view your cart.</p>';
    updateCartCount(0);
    calculateTotal();
  }
});