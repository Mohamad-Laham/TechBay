// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }
  
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': idToken,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

export async function fetchCheckoutItems() {
  const checkoutItemsDiv = document.getElementById('checkout-items');
  const checkoutTotalDiv = document.getElementById('checkout-total');
  const paymentBtn = document.getElementById('payment-btn');

  try {
    const response = await authenticatedFetch('https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/cart');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'index.html';
        return;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    const items = JSON.parse(data.body);

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
              const response = await authenticatedFetch(`https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/products/${item.productId}?category=${foundCategory}`);
              if (response.ok) {
                const responseData = await response.json();
                data = JSON.parse(responseData.body);
                if (data && data.productId) foundCategory = data.category;
              }
            }

            if (!data || !data.productId) {
              for (const category of categories) {
                const response = await authenticatedFetch(`https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/products/${item.productId}?category=${category}`);
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
  
  paymentBtn.addEventListener('click', async () => {
    try {
      paymentBtn.disabled = true;
      paymentBtn.textContent = 'Processing...';
      
      const response = await authenticatedFetch('https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/cart', {
        method: 'DELETE',
        body: JSON.stringify({ body: JSON.stringify({ clearAll: true }) })
      });
      
      if (response.ok) {
        alert('Payment successful! Your order has been placed.');
        window.location.href = 'index.html';
      } else {
        throw new Error('Failed to clear cart after payment');
      }
    } catch (error) {
      console.error('Payment error:', error.message);
      alert('Payment processing failed. Please try again.');
      paymentBtn.disabled = false;
      paymentBtn.textContent = 'Proceed to Payment';
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Check if authenticated before loading checkout
  if (!localStorage.getItem('idToken')) {
    window.location.href = 'index.html';
    return;
  }
  
  await fetchCheckoutItems();
  setupPaymentButton();
  
  function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    cartLinks.forEach(link => {
      link.textContent = 'Cart (0)';
    });
  }
  updateCartCount();
});
