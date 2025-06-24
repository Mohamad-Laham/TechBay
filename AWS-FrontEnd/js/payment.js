// payment.js
import { API_BASE_URL } from '../config/apiConfig.js';

// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  if (!idToken) throw new Error('Not authenticated');

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
  }

  return response.json(); // Return parsed JSON directly
}

// Fetch product info by trying multiple categories if needed
async function fetchProductData(productId, originalCategory) {
  const categories = ['phone', 'tablet', 'television', 'headphone', 'PC Screen', 'PC', 'laptop'];
  let data = null;
  let foundCategory = originalCategory.toLowerCase().replace(/s$/, '');

  if (categories.includes(foundCategory)) {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${productId}?category=${foundCategory}`);
    data = response.body ? JSON.parse(response.body) : null;
    if (data?.productId) return data;
  }

  for (const category of categories) {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${productId}?category=${category}`);
    data = response.body ? JSON.parse(response.body) : null;
    if (data?.productId) return data;
  }

  return null;
}

export async function fetchPaymentItems() {
  const paymentItemsDiv = document.getElementById('payment-items');
  const paymentTotalDiv = document.getElementById('payment-total');
  const payNowBtn = document.getElementById('pay-now-btn');

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/cart`, { method: 'GET' });
    const { items = [] } = response;

    paymentItemsDiv.innerHTML = '';
    if (items.length === 0) {
      paymentItemsDiv.innerHTML = '<p class="empty-cart-message">Your cart is empty.</p>';
      paymentTotalDiv.innerHTML = '<strong>Total: $0.00</strong>';
      payNowBtn.disabled = true;
      return;
    }

    let total = 0;

    const itemPromises = items.map(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'payment-item';

      return (async () => {
        try {
          const data = await fetchProductData(item.productId, item.category);

          if (!data) throw new Error(`Product ${item.productId} not found`);

          const pricePerUnit = data.price || 0;
          const finalPrice = pricePerUnit * item.quantity;
          total += finalPrice;

          itemDiv.innerHTML = `
            <img src="${data.imageUrl || 'placeholder.jpg'}" alt="${data.brand || 'Product'}" class="payment-item-image">
            <div class="checkout-item-details">
              <h3>${data.brand || 'Unknown Product'}</h3>
              <p>Price: $${pricePerUnit.toFixed(2)}</p>
              <p>Quantity: ${item.quantity}</p>
              <p class="checkout-item-total">Item Total: $${finalPrice.toFixed(2)}</p>
            </div>
          `;
        } catch (err) {
          itemDiv.innerHTML = `
            <div class="checkout-item-details">
              <h3>Unknown Product - ${item.productId}</h3>
              <p>Price: $0.00</p>
              <p>Quantity: ${item.quantity}</p>
              <p class="checkout-item-total">Item Total: $0.00</p>
            </div>
          `;
        } finally {
          paymentItemsDiv.appendChild(itemDiv);
        }
      })();
    });

    await Promise.all(itemPromises);

    paymentTotalDiv.innerHTML = `
      <div class="payment-total-row">
        <span>Subtotal:</span>
        <span>$${total.toFixed(2)}</span>
      </div>
      <div class="payment-total-row">
        <span>Shipping:</span>
        <span>Free</span>
      </div>
      <div class="payment-total-row grand-total">
        <span>Total:</span>
        <span class="total-price">$${total.toFixed(2)}</span>
      </div>
    `;

    window.paymentTotal = total;
    payNowBtn.disabled = false;
  } catch (error) {
    console.error('Error:', error.message);
    paymentItemsDiv.innerHTML = '<p class="error-message">Failed to load cart items.</p>';
    paymentTotalDiv.innerHTML = '<div class="error-message">Could not calculate total</div>';
    payNowBtn.disabled = true;
    if (error.message === 'Not authenticated') {
      window.location.href = 'index.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const paymentForm = document.getElementById('payment-form');
  const paymentResult = document.getElementById('payment-result');
  const payNowBtn = document.getElementById('pay-now-btn');
  const authSection = document.getElementById('auth-section');

  // Setup auth section
  const isAuthenticated = localStorage.getItem('idToken') !== null;
  authSection.innerHTML = '';
  if (isAuthenticated) {
    try {
      const auth = await import('./auth.js');
      const email = await auth.default.getUserEmail();
      const emailSpan = document.createElement('span');
      emailSpan.textContent = `${email} | `;
      emailSpan.className = 'user-email';
      authSection.appendChild(emailSpan);

      const logoutBtn = document.createElement('a');
      logoutBtn.href = '#';
      logoutBtn.className = 'logout-btn';
      logoutBtn.textContent = 'Log Out';
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.logout) window.logout();
      });
      authSection.appendChild(logoutBtn);
    } catch (err) {
      console.error('Error loading auth:', err.message);
    }
  } else {
    const loginBtn = document.createElement('a');
    loginBtn.href = '#';
    loginBtn.className = 'login-btn';
    loginBtn.textContent = 'Log In';
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.login) window.login();
    });
    authSection.appendChild(loginBtn);
  }

  await fetchPaymentItems();

  // Submit handler
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = paymentForm.querySelector('input[name="name"]').value;
    const email = paymentForm.querySelector('input[name="email"]').value;
    const address = paymentForm.querySelector('textarea[name="address"]').value;

    if (!name || !email || !address) {
      paymentResult.textContent = 'Please fill in all required fields.';
      paymentResult.className = 'result error';
      return;
    }

    payNowBtn.disabled = true;
    payNowBtn.textContent = 'Processing...';

    try {
      const cart = await authenticatedFetch(`${API_BASE_URL}/api/cart`, { method: 'GET' });
      const { items = [] } = cart;
      if (!items.length) throw new Error('No products in cart');

      const productsWithBrands = await Promise.all(items.map(async (item) => {
        const data = await fetchProductData(item.productId, item.category);
        return {
          productId: item.productId,
          quantity: item.quantity,
          brand: data?.brand || 'N/A'
        };
      }));

      const totalPrice = window.paymentTotal || 0;
      const orderResponse = await authenticatedFetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        body: JSON.stringify({ products: productsWithBrands, totalPrice, email, address })
      });

      if (orderResponse.message) {
        paymentResult.textContent = `${orderResponse.message} An admin has been notified of your purchase.`;
        paymentResult.className = 'result success';

        // Clear cart
        for (const item of items) {
          try {
            await authenticatedFetch(`${API_BASE_URL}/api/cart`, {
              method: 'DELETE',
              body: JSON.stringify({ productId: item.productId })
            });
          } catch (err) {
            console.warn(`Failed to delete productId ${item.productId}:`, err.message);
          }
        }

        // Redirect after cart is cleared
        window.location.href = 'index.html';
      } else {
        paymentResult.textContent = 'Payment simulation failed';
        paymentResult.className = 'result error';
      }
    } catch (err) {
      console.error('Payment error:', err.message);
      paymentResult.textContent = 'An error occurred during payment.';
      paymentResult.className = 'result error';
    } finally {
      payNowBtn.disabled = false;
      payNowBtn.textContent = 'Pay Now';
    }
  });
});