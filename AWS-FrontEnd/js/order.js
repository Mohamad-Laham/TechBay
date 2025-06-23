import { API_BASE_URL } from '../config/apiConfig.js';

// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  console.log('authenticatedFetch: Sending Authorization:', idToken ? `Bearer ${idToken.substring(0, 20)}...` : 'No token');

  if (!idToken) {
    console.error('authenticatedFetch: No idToken found, throwing Not authenticated error');
    throw new Error('Not authenticated');
  }

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
    console.error('authenticatedFetch: API Error Response (raw):', text);
    throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
  }

  console.log('authenticatedFetch: Request to', url, 'succeeded with status', response.status);
  return response;
}

async function fetchOrders() {
  const orderTableBody = document.getElementById('order-table-body');
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const authSection = document.getElementById('auth-section');

  loadingDiv.style.display = 'block';
  orderTableBody.innerHTML = '';
  errorDiv.style.display = 'none';

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/orders`, { method: 'GET' });
    const data = await response.json();
    console.log('Fetched orders data:', data);
    const orders = data.orders || [];
    const email = data.userInfo?.email || 'N/A'; // Use email from userInfo in response
    const isAdmin = data.isAdmin || false;

    if (orders.length === 0) {
      orderTableBody.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>'; // Updated colspan to 5
    } else {
      for (const order of orders) {
        const row = document.createElement('tr');
        // Use totalPrice, email, and address directly from the API response
        const totalPrice = order.totalPrice !== undefined ? order.totalPrice.toFixed(2) : '0.00';
        // Use brands from the products array, fallback to 'Unknown' if brand is missing
        const brandDisplay = order.products && order.products.length > 0
          ? order.products.map(product => product.brand || 'Unknown').join(', ')
          : 'N/A';
        row.innerHTML = `
          <td>${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</td>
          <td>${brandDisplay}</td> <!-- Display only brands for the order -->
          <td>${order.email || 'N/A'}</td> <!-- Use order-specific email -->
          <td>${order.address || 'N/A'}</td> <!-- Use order-specific address -->
          <td>$${totalPrice}</td>
        `;
        orderTableBody.appendChild(row);
      }
    }
    loadingDiv.style.display = 'none';
    if (authSection) {
      const emailSpan = authSection.querySelector('.user-email');
      if (emailSpan) emailSpan.textContent = isAdmin ? 'Admin View' : email; // Update auth section with response email
    }
  } catch (err) {
    console.error('Fetch orders error:', err);
    errorDiv.textContent = err.message || 'Failed to load orders';
    errorDiv.style.display = 'block';
    loadingDiv.style.display = 'none';
    if (err.message === 'Not authenticated') {
      window.location.href = 'index.html';
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const authSection = document.getElementById('auth-section');

  console.log('DOMContentLoaded: Page loaded, checking elements');
  if (!authSection) {
    console.error('DOMContentLoaded: auth-section not found');
  }

  if (authSection) {
    console.log('DOMContentLoaded: Setting up auth section');
    const isAuthenticated = localStorage.getItem('idToken') !== null;
    authSection.innerHTML = '';
    if (isAuthenticated) {
      console.log('DOMContentLoaded: User is authenticated');
      const emailSpan = document.createElement('span');
      emailSpan.className = 'user-email';
      emailSpan.textContent = 'Loading...'; // Placeholder until fetchOrders updates it
      authSection.appendChild(emailSpan);
    } else {
      console.log('DOMContentLoaded: User is not authenticated');
      const loginBtn = document.createElement('a');
      loginBtn.href = '#';
      loginBtn.className = 'login-btn';
      loginBtn.textContent = 'Log In';
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('DOMContentLoaded: Login button clicked');
        if (window.login) window.login();
      });
      authSection.appendChild(loginBtn);
    }
  }

  await fetchOrders();
});