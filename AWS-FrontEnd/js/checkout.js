import { API_BASE_URL } from '../config/apiConfig.js';

// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  console.log('Sending Authorization:', idToken ? `Bearer ${idToken}` : 'No token'); // Debug token

  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${idToken}`, // Explicitly set with Bearer prefix
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const text = await response.text(); // Get raw response
    console.error('API Error Response (raw):', text);
    throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
  }

  return response;
}

export async function fetchCheckoutItems() {
  const checkoutItemsDiv = document.getElementById('checkout-items');
  const checkoutTotalDiv = document.getElementById('checkout-total');
  const paymentBtn = document.getElementById('payment-btn');

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/cart`, {
      method: 'GET'
    });
    const data = await response.json();
    const items = data.items || []; // Assuming the Lambda returns { items: [...] }

    checkoutItemsDiv.innerHTML = '';
    if (items.length === 0) {
      checkoutItemsDiv.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
      checkoutTotalDiv.innerHTML = '<strong>Total: $0.00</strong>';
      paymentBtn.disabled = true;
    } else {
      const categories = ['phone', 'tablet', 'television', 'headphone', 'PC Screen', 'PC', 'laptop'];
      let total = 0;

      const itemPromises = items.map(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checkout-item';

        return (async () => {
          let data = null;
          let foundCategory = item.category.toLowerCase().replace(/s$/, '');

          try {
            if (foundCategory && categories.includes(foundCategory)) {
              const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${item.productId}?category=${foundCategory}`);
              if (response.ok) {
                const responseData = await response.json();
                data = JSON.parse(responseData.body);
                if (data && data.productId) foundCategory = data.category;
              }
            }

            if (!data || !data.productId) {
              for (const category of categories) {
                const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${item.productId}?category=${category}`);
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
              throw new Error(`Product ${item.productId} not found`);
            }

            const pricePerUnit = data.price || 0;
            const finalPrice = pricePerUnit * item.quantity;
            total += finalPrice;

            itemDiv.innerHTML = `
              <img src="${data.imageUrl || 'placeholder.jpg'}" alt="${data.brand || 'Product'}" class="checkout-item-image">
              <div class="checkout-item-details">
                <h3>${data.brand || 'Unknown Product'}</h3>
                <p>Price: $${pricePerUnit.toFixed(2)}</p>
                <p>Quantity: ${item.quantity}</p>
                <p class="checkout-item-total">Item Total: $${finalPrice.toFixed(2)}</p>
              </div>
            `;
            checkoutItemsDiv.appendChild(itemDiv);
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error.message);
            itemDiv.innerHTML = `
              <div class="checkout-item-details">
                <h3>Unknown Product - ${item.productId}</h3>
                <p>Price: $0.00</p>
                <p>Quantity: ${item.quantity}</p>
                <p class="checkout-item-total">Item Total: $0.00</p>
              </div>
            `;
            checkoutItemsDiv.appendChild(itemDiv);
          }
        })();
      });

      await Promise.all(itemPromises);

      checkoutTotalDiv.innerHTML = `
        <div class="checkout-total-row">
          <span>Subtotal:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
        <div class="checkout-total-row">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div class="checkout-total-row grand-total">
          <span>Total:</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      `;

      paymentBtn.disabled = false;
    }
  } catch (error) {
    console.error('Error fetching cart items for checkout:', error.message);
    if (error.message === 'Not authenticated') {
      window.location.href = 'index.html';
    } else {
      checkoutItemsDiv.innerHTML = '<p class="error-message">Failed to load checkout items. Please try again later.</p>';
      checkoutTotalDiv.innerHTML = '<div class="error-message">Could not calculate total</div>';
      paymentBtn.disabled = true;
    }
  }
}

export function setupPaymentButton() {
  const paymentBtn = document.getElementById('payment-btn');

  paymentBtn.addEventListener('click', () => {
    // Redirect to payment page
    window.location.href = 'payment.html';
  });
}
document.addEventListener('DOMContentLoaded', async () => {
  if (!localStorage.getItem('idToken')) {
    window.location.href = 'index.html';
    return;
  }

  await fetchCheckoutItems();
  setupPaymentButton();

  function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    cartLinks.forEach(link => {
      link.textContent = `Cart (0)`;
    });
  }
  updateCartCount();
});