import { API_BASE_URL } from '../config/apiConfig.js';

// Helper function to make authenticated API calls
async function authenticatedFetch(url, options = {}) {
  const idToken = localStorage.getItem('idToken');
  
  if (!idToken) {
    console.error('authenticatedFetch: No idToken found in localStorage');
    throw new Error('Not authenticated');
  }
  
  const fetchOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  console.debug('authenticatedFetch: Sending request', {
    url,
    method: fetchOptions.method || 'GET',
    headers: fetchOptions.headers,
    body: fetchOptions.body
  });
  
  try {
    const response = await fetch(url, fetchOptions);
    console.debug('authenticatedFetch: Received response', {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { message: 'Failed to parse error response' };
      }
      console.error('authenticatedFetch: Request failed', {
        url,
        status: response.status,
        error: errorBody
      });
      throw new Error(errorBody.message || `HTTP error ${response.status}`);
    }
    
    const responseData = await response.json();
    console.debug('authenticatedFetch: Parsed response data', responseData);
    return responseData;
  } catch (err) {
    console.error('authenticatedFetch: Network or other error', {
      error: err.message,
      url,
      options: fetchOptions
    });
    throw err;
  }
}

// Category configuration
const categoryConfig = {
  phone: {
    requiredFields: ['brand', 'modelName', 'memoryStorageCapacity', 'ram', 'displayResolutionMaximum', 'color', 'price'],
    category: 'phones'
  },
  tablet: {
    requiredFields: ['brand', 'modelName', 'memoryStorageCapacity', 'ram', 'displayResolutionMaximum', 'price'],
    category: 'tablets'
  },
  television: {
    requiredFields: ['brand', 'modelName', 'size', 'hz', 'resolution', 'aspectRatio', 'price'],
    category: 'televisions'
  },
  pc: {
    requiredFields: ['brand', 'modelName', 'motherboardCompatibility', 'memorySize', 'ssd', 'graphicsCard', 'processor', 'price'],
    category: 'PC'
  },
  laptop: {
    requiredFields: ['brand', 'modelName', 'motherboardCompatibility', 'memorySize', 'ssd', 'graphicsCard', 'processor', 'price'],
    category: 'laptops'
  },
  headphone: {
    requiredFields: ['brand', 'modelName', 'price'],
    category: 'headphones'
  },
  pcscreen: {
    requiredFields: ['brand', 'modelName', 'size', 'hz', 'resolution', 'aspectRatio', 'price'],
    category: 'PC Screens'
  }
};

// Helper function to validate and prepare product data
function prepareProductData(formData, type) {
  const formDataObj = Object.fromEntries(formData);
  console.debug(`prepareProductData: Raw form data for ${type}`, formDataObj);

  const { requiredFields, category } = categoryConfig[type];
  const imageUrl = formData.get('imageUrl');

  // Validate required fields
  for (const field of requiredFields) {
    if (!formDataObj[field] || formDataObj[field].trim() === '') {
      const errorMsg = `Missing required field: ${field}`;
      console.error(`prepareProductData: Validation failed for ${type}`, { field });
      throw new Error(errorMsg);
    }
  }

  // Prepare product data
  const productData = {
    category,
    createdAt: new Date().toISOString()
  };

  if (imageUrl && imageUrl.trim() !== '') {
    productData.imageUrl = imageUrl;
  }

  Object.entries(formDataObj).forEach(([key, value]) => {
    if (key !== 'imageUrl' && value.trim() !== '') {
      productData[key] = key === 'price' ? parseFloat(value) :
                        key === 'size' || key === 'hz' || key === 'memoryStorageCapacity' || 
                        key === 'ram' || key === 'memorySize' || key === 'ssd' ? parseInt(value) : value;
    }
  });

  console.debug(`prepareProductData: Prepared product data for ${type}`, productData);
  return productData;
}

// Separate POST functions for each category
async function postPhone(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'phone');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/phone`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postPhone: Phone added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Phone';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postPhone: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add phone';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Phone';
    handleAuthError(err);
  }
}

async function postTablet(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'tablet');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/tablet`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postTablet: Tablet added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Tablet';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postTablet: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add tablet';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Tablet';
    handleAuthError(err);
  }
}

async function postTelevision(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'television');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/television`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postTelevision: Television added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Television';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postTelevision: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add television';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Television';
    handleAuthError(err);
  }
}

async function postPC(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'pc');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/pc`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postPC: PC added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add PC';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postPC: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add PC';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add PC';
    handleAuthError(err);
  }
}

async function postLaptop(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'laptop');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/laptop`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postLaptop: Laptop added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Laptop';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postLaptop: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add laptop';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Laptop';
    handleAuthError(err);
  }
}

async function postHeadphone(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'headphone');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/headphone`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postHeadphone: Headphone added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Headphone';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postHeadphone: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add headphone';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add Headphone';
    handleAuthError(err);
  }
}

async function postPCScreen(e, errorDiv) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Adding...';
  errorDiv.textContent = '';

  try {
    const formData = new FormData(form);
    const productData = prepareProductData(formData, 'pcscreen');
    const requestBody = { body: JSON.stringify(productData) };
    const responseData = await authenticatedFetch(`${API_BASE_URL}/api/products/pcscreen`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    console.log('postPCScreen: PC Screen added successfully', responseData);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add PC Screen';
    form.closest('.modal').style.display = 'none';
    form.reset();
    errorDiv.textContent = '';
  } catch (err) {
    console.error('postPCScreen: Error', { error: err.message, stack: err.stack });
    errorDiv.textContent = err.message || 'Failed to add PC Screen';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Add PC Screen';
    handleAuthError(err);
  }
}

// Handle authentication errors
function handleAuthError(err) {
  if (err.message.includes('Authentication expired') || err.message.includes('401')) {
    console.debug('handleAuthError: Redirecting to index.html due to authentication error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.debug('create-product.js: DOMContentLoaded event fired');
  
  const productCards = document.querySelectorAll('.product-card');
  const cancelButtons = document.querySelectorAll('.cancel-btn');

  // Attach click event listeners to product cards
  productCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const type = card.dataset.type;
      console.debug(`productCard click: Opening modal for ${type}`);
      const modal = document.getElementById(`${type}-modal`);

      // Close all other modals
      document.querySelectorAll('.modal').forEach(m => {
        if (m !== modal) m.style.display = 'none';
      });

      modal.style.display = 'block';

      // Position modal
      const productGrid = document.querySelector('.product-grid');
      const gridRect = productGrid.getBoundingClientRect();
      
      modal.style.position = 'absolute';
      modal.style.top = `${gridRect.bottom + window.scrollY + 20}px`;
      modal.style.left = '50%';
      modal.style.transform = 'translateX(-50%)';
      modal.style.width = '600px';
      modal.style.maxWidth = '90%';
      modal.style.zIndex = '1000';
    });
  });

  // Attach click event listeners to cancel buttons
  cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.dataset.modal;
      console.debug(`cancelButton click: Closing modal for ${modal}`);
      document.getElementById(`${modal}-modal`).style.display = 'none';
      document.getElementById(`${modal}-form`).reset();
      document.getElementById(`${modal}-error`).textContent = '';
    });
  });

  // Attach submit event listeners for each category
  console.debug('create-product.js: Attaching form submit listeners');
  document.getElementById('phone-form').addEventListener('submit', (e) => postPhone(e, document.getElementById('phone-error')));
  document.getElementById('tablet-form').addEventListener('submit', (e) => postTablet(e, document.getElementById('tablet-error')));
  document.getElementById('television-form').addEventListener('submit', (e) => postTelevision(e, document.getElementById('television-error')));
  document.getElementById('pc-form').addEventListener('submit', (e) => postPC(e, document.getElementById('pc-error')));
  document.getElementById('laptop-form').addEventListener('submit', (e) => postLaptop(e, document.getElementById('laptop-error')));
  document.getElementById('headphone-form').addEventListener('submit', (e) => postHeadphone(e, document.getElementById('headphone-error')));
  document.getElementById('pcscreen-form').addEventListener('submit', (e) => postPCScreen(e, document.getElementById('pcscreen-error')));
});