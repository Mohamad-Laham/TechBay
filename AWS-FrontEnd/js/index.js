// index.js

// Helper function to make authenticated API calls (optional auth for index)
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  console.log('Sending Authorization:', idToken ? `Bearer ${idToken}` : 'No token'); // Debug token
  
  return fetch(url, {
    ...options,
    headers: {
      ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}), // Add Bearer prefix
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const productsDiv = document.getElementById('products');
  const loadingDiv = document.getElementById('loading');
  const searchBar = document.getElementById('search-bar');
  const categoryFilters = document.querySelectorAll('.category-filters button');
  let products = [];
  let activeCategory = 'all';

  function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    cartLinks.forEach(link => {
      link.textContent = `Cart (0)`;
    });
  }

  async function fetchProducts() {
    try {
      // Products can be fetched without authentication
      const response = await fetch('https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      products = JSON.parse(data.body);
      if (!Array.isArray(products)) throw new Error('Unexpected response format');

      displayProducts(products, activeCategory);
      loadingDiv.style.display = 'none';
      updateCartCount();
    } catch (err) {
      window.location.href = 'error.html';
    }
  }

  function displayProducts(productsToShow, category) {
    productsDiv.innerHTML = '';
    const filteredProducts = category === 'all' ? productsToShow : productsToShow.filter(p => p.category === category);

    const categories = {
      'phones': [], 'tablets': [], 'televisions': [], 'headphones': [],
      'PC Screens': [], 'PC': [], 'laptops': []
    };

    filteredProducts.forEach(product => {
      if (categories[product.category]) categories[product.category].push(product);
    });

    for (const [cat, catProducts] of Object.entries(categories)) {
      if (catProducts.length > 0 && (category === 'all' || category === cat)) {
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';
        categorySection.innerHTML = `<h2>${cat}</h2>`;
        const grid = document.createElement('div');
        grid.className = 'product-grid';

        catProducts.forEach(product => {
          const card = document.createElement('a');
          const apiCategory = cat.replace(/s$/, '');
          card.href = `product.html?id=${product.productId}&category=${apiCategory}`;
          card.className = 'product-card';
          
          // Check if user is authenticated to show Add to Cart button
          const isAuthenticated = localStorage.getItem('idToken') !== null;
          
          card.innerHTML = `
            <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${(product.brand || 'Unknown') + ' ' + (product.modelName || '')}" class="product-image">
            <div class="content">
              <h3>${product.modelName || 'Unknown Model'}</h3>
              <p class="brand">${product.brand || 'Unknown Brand'}</p>
              <p>Price: $${product.price || 'N/A'}</p>
              ${isAuthenticated ? `<button class="add-to-cart-btn" data-product-id="${product.productId}" data-category="${product.category}">Add to Cart</button>` : ''}
            </div>
          `;
          grid.appendChild(card);
        });

        categorySection.appendChild(grid);
        productsDiv.appendChild(categorySection);
      }
    }

    // Add event listeners for Add to Cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const productId = e.target.dataset.productId;
        const category = e.target.dataset.category;
        await addToCart(productId, 1, category);
      });
    });
  }

  async function addToCart(productId, quantity, category) {
    // Check if user is authenticated
    if (!localStorage.getItem('idToken')) {
      if (confirm('You need to be logged in to add items to cart. Would you like to login now?')) {
        login(); // This function is from auth.js
      }
      return;
    }

    const innerData = { productId, quantity, category };
    const requestData = { body: JSON.stringify(innerData) }; // Format as {"body": "{\"productId\":\"...\",\"quantity\":...,\"category\":\"...\"}"}
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
  }

  categoryFilters.forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      categoryFilters.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      displayProducts(products, activeCategory);
    });
  });

  searchBar.addEventListener('input', () => {
    const query = searchBar.value.toLowerCase();
    const filtered = products.filter(product =>
      (product.brand?.toLowerCase() || '').includes(query) ||
      (product.modelName?.toLowerCase() || '').includes(query)
    );
    displayProducts(filtered, activeCategory);
  });

  categoryFilters[0].classList.add('active');
  fetchProducts();
});