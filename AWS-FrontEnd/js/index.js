//import { API_BASE_URL } from '../config/apiConfig.js';


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

  // Initialize suggestionsDiv upfront
  let suggestionsDiv = createSuggestionsDiv();

  // Helper function to update the cart count
  async function updateCartCount() {
    const cartLinks = document.querySelectorAll('.cart-btn');
    const idToken = localStorage.getItem('idToken');

    //`${API_BASE_URL}/api/products/phone
    if (idToken) {
      try {
        const response = await authenticatedFetch(`https://7q4o04d3nh.execute-api.us-east-1.amazonaws.com/prod/api/cart`, {
          method: 'GET'
        });
        const data = await response.json();
        const { items = [] } = data; // Assuming the Lambda returns { items: [...] }
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
      updateCartCount(); // Update cart count on page load
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
          
          // Use brand name if modelName is "Unknown", otherwise use modelName
          const displayName = product.modelName === 'Unknown' ? product.brand : product.modelName || product.brand || 'Unknown';

          card.innerHTML = `
            <img src="${product.imageUrl || 'placeholder.jpg'}" alt="${(product.brand || 'Unknown') + ' ' + (product.modelName || '')}" class="product-image">
            <div class="content">
              <h3>${displayName}</h3>
              <p class="brand">${product.brand || 'Unknown Brand'}</p>
              <p>Price: $${product.price || 'N/A'}</p>
              <button class="add-to-cart-btn" data-product-id="${product.productId}" data-category="${product.category}">Add to Cart</button>
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

    const requestData = {
      productId: productId,
      quantity: quantity,
      category: category,
      price: 0 // Placeholder; fetch actual price if needed
    };
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

      if (data.statusCode === 200 || data.statusCode === 201) {
        const bodyData = data.body ? JSON.parse(data.body) : data;
        if (bodyData.message && bodyData.message.includes('updated')) {
          alert('Item added/updated in cart!');
          updateCartCount();
        } else if (bodyData.message && bodyData.message.includes('added')) {
          alert('Item added to cart!');
          updateCartCount();
        } else {
          alert(`Failed to add item: ${bodyData.message || 'Unknown error'}`);
        }
      } else {
        alert(`Failed to add item: ${data.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error.message);
      alert('An error occurred while adding to cart. Check console for details.');
    }
  }

  // Autocomplete functionality
  function createSuggestionsDiv() {
    let suggestionsDiv = document.querySelector('.suggestions');
    if (!suggestionsDiv) {
      suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'suggestions';
      suggestionsDiv.style.position = 'absolute';
      suggestionsDiv.style.backgroundColor = 'white';
      suggestionsDiv.style.border = '1px solid #e5e7eb';
      suggestionsDiv.style.borderRadius = '0.375rem';
      suggestionsDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      suggestionsDiv.style.zIndex = '1000';
      suggestionsDiv.style.maxHeight = '200px';
      suggestionsDiv.style.overflowY = 'auto';
      searchBar.parentNode.appendChild(suggestionsDiv);
    }
    return suggestionsDiv;
  }

  function showSuggestions(query) {
    if (!query) {
      suggestionsDiv.style.display = 'none';
      return;
    }

    const filtered = products.filter(product =>
      (product.brand?.toLowerCase().includes(query.toLowerCase()) || product.modelName?.toLowerCase().includes(query.toLowerCase()))
    ).map(product => ({
      name: product.modelName || product.brand || 'Unknown',
      category: product.category
    }));

    const uniqueSuggestions = [...new Map(filtered.map(item => [item.name, item])).values()];

    if (uniqueSuggestions.length > 0) {
      suggestionsDiv.innerHTML = '';
      uniqueSuggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = `${suggestion.name} (${suggestion.category})`;
        div.style.padding = '0.5rem 1rem';
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
          searchBar.value = suggestion.name;
          suggestionsDiv.style.display = 'none';
          displayProducts(products.filter(p => 
            (p.brand?.toLowerCase() === suggestion.name.toLowerCase() || p.modelName?.toLowerCase() === suggestion.name.toLowerCase())
          ), activeCategory);
        });
        suggestionsDiv.appendChild(div);
      });
      suggestionsDiv.style.display = 'block';
      suggestionsDiv.style.width = `${searchBar.offsetWidth}px`;
      suggestionsDiv.style.top = `${searchBar.offsetTop + searchBar.offsetHeight + 2}px`;
      suggestionsDiv.style.left = `${searchBar.offsetLeft}px`;
    } else {
      suggestionsDiv.style.display = 'none';
    }
  }

  searchBar.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    showSuggestions(query);
    const filtered = products.filter(product =>
      (product.brand?.toLowerCase() || '').includes(query) ||
      (product.modelName?.toLowerCase() || '').includes(query)
    );
    displayProducts(filtered, activeCategory);
  });

  searchBar.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && suggestionsDiv && suggestionsDiv.style.display === 'block') {
      e.preventDefault();
      const firstSuggestion = suggestionsDiv.querySelector('.suggestion-item');
      if (firstSuggestion) {
        searchBar.value = firstSuggestion.textContent.split(' (')[0];
        suggestionsDiv.style.display = 'none';
        displayProducts(products.filter(p => 
          (p.brand?.toLowerCase() === searchBar.value.toLowerCase() || p.modelName?.toLowerCase() === searchBar.value.toLowerCase())
        ), activeCategory);
      }
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (suggestionsDiv && !searchBar.contains(e.target) && !suggestionsDiv.contains(e.target)) {
      suggestionsDiv.style.display = 'none';
    }
  });

  categoryFilters.forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      categoryFilters.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      displayProducts(products, activeCategory);
    });
  });

  categoryFilters[0].classList.add('active');
  fetchProducts();
});