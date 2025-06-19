console.log('cart.js loaded');

// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  console.log('authenticatedFetch called for:', url);
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

export async function fetchCartItems() {
  console.log('fetchCartItems called');
  const cartItemsDiv = document.getElementById('cart-items');
  const toggleIdsBtn = document.getElementById('toggle-ids-btn');
  let showIds = false;

  try {
    const response = await authenticatedFetch('https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/cart');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'index.html';
        return;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json(); // Parses to { items: [...] }
    const items = data.items; // Directly access the items array
    console.log('Cart items fetched:', items);

    cartItemsDiv.innerHTML = '';
    if (items.length === 0) {
      cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
      calculateTotal();
    } else {
      const categories = ['phone', 'tablet', 'television', 'headphone', 'PC Screen', 'PC', 'laptop'];

      const itemPromises = items.map(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';

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

            itemDiv.innerHTML = `
              <img src="${data.imageUrl || 'placeholder.jpg'}" alt="${data.brand || 'Product'} Image" class="cart-item-image">
              <div class="cart-item-details">
                <h3>${data.brand || 'Unknown Product'}</h3>
                ${showIds ? `<p class="cart-item-id">ID: ${item.productId}</p>` : ''}
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
            body: JSON.stringify({ productId, tableName: 'cartTest' })
          };
          console.log('Attempting to remove from cart with body:', JSON.stringify(requestData));

          try {
            const response = await authenticatedFetch('https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/cart', {
              method: 'DELETE',
              body: JSON.stringify(requestData)
            });
            const data = await response.json();
            console.log('Remove API Response:', data);

            if (data.statusCode === 200) {
              const bodyData = JSON.parse(data.body);
              if (bodyData.success) {
                alert('Item removed from cart!');
                await fetchCartItems();
                calculateTotal();
              } else {
                alert(`Failed to remove item: ${bodyData.message || 'Unknown error'}`);
              }
            } else {
              const bodyData = JSON.parse(data.body);
              alert(`Failed to remove item: ${bodyData.message || 'Server error'}`);
            }
          } catch (error) {
            console.error('Error removing from cart:', error.message);
            alert('An error occurred while removing from cart. Check console for details.');
          }
        });
      });

      calculateTotal();
    }
  } catch (error) {
    console.error('Error fetching cart items:', error.message);
    if (error.message === 'Not authenticated') {
      window.location.href = 'index.html';
    } else {
      cartItemsDiv.innerHTML = '<p>Failed to load cart items. Please try again later or check console for details.</p>';
    }
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
    cartTotalDiv.innerHTML = '<strong>Total: $0.00</strong>';
    return;
  }

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
    cartTotalDiv.innerHTML = `<strong>Total: $${total.toFixed(2)}</strong>`;
  }
  console.log('cartTotalDiv after update:', cartTotalDiv.innerHTML);
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM fully loaded');
  const cartItemsDiv = document.getElementById('cart-items');
  const cartTotalDiv = document.getElementById('cart-total');

  await fetchCartItems();
  calculateTotal();

  function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    cartLinks.forEach(link => {
      link.textContent = `Cart (0)`;
    });
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  console.log('checkoutBtn:', checkoutBtn);
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }
});