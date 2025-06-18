import { API_BASE_URL } from '../config/apiConfig.js';

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

document.addEventListener('DOMContentLoaded', () => {
  const productCards = document.querySelectorAll('.product-card');
  const cancelButtons = document.querySelectorAll('.cancel-btn');

  async function handleSubmit(e, type, errorDiv) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';
    errorDiv.textContent = '';

    try {
      const formData = new FormData(form);
      const imageUrl = formData.get('imageUrl');
      if (!imageUrl || imageUrl.trim() === '') throw new Error('Image URL is required');

      const categoryMap = {
        phone: 'phones',
        tablet: 'tablets',
        television: 'televisions',
        pc: 'PC',
        laptop: 'laptops',
        headphone: 'headphones',
        pcscreen: 'PC Screens'
      };
      const category = categoryMap[type] || type;
      const productData = {
        createdAt: new Date().toISOString(),
        imageUrl,
        category
      };
      formData.forEach((value, key) => {
        if (key !== 'imageUrl' && value.trim() !== '') {
          productData[key] = key === 'price' ? parseFloat(value) :
                            key === 'size' || key === 'hz' || key === 'memoryStorageCapacity' || 
                            key === 'ram' || key === 'memorySize' || key === 'ssd' ? parseInt(value) : value;
        }
      });

      const response = await authenticatedFetch(`${API_BASE_URL}/api/products/${type}`, {
        method: 'POST',
        body: JSON.stringify({ body: JSON.stringify(productData) })
      });
      
      if (response.status === 401) {
        throw new Error('Authentication expired. Please login again.');
      }
      
      if (!response.ok) throw new Error(`Failed to add ${type}`);
      
      submitBtn.disabled = false;
      submitBtn.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      form.closest('.modal').style.display = 'none';
      form.reset();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} added successfully!`);
    } catch (err) {
      errorDiv.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      
      if (err.message.includes('Authentication expired')) {
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      }
    }
  }

  productCards.forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.type;
      document.getElementById(`${type}-modal`).style.display = 'flex';
    });
  });

  cancelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.dataset.modal;
      document.getElementById(`${modal}-modal`).style.display = 'none';
      document.getElementById(`${modal}-form`).reset();
      document.getElementById(`${modal}-error`).textContent = '';
    });
  });

  document.getElementById('phone-form').addEventListener('submit', (e) => handleSubmit(e, 'phone', document.getElementById('phone-error')));
  document.getElementById('tablet-form').addEventListener('submit', (e) => handleSubmit(e, 'tablet', document.getElementById('tablet-error')));
  document.getElementById('television-form').addEventListener('submit', (e) => handleSubmit(e, 'television', document.getElementById('television-error')));
  document.getElementById('pc-form').addEventListener('submit', (e) => handleSubmit(e, 'pc', document.getElementById('pc-error')));
  document.getElementById('laptop-form').addEventListener('submit', (e) => handleSubmit(e, 'laptop', document.getElementById('laptop-error')));
  document.getElementById('headphone-form').addEventListener('submit', (e) => handleSubmit(e, 'headphone', document.getElementById('headphone-error')));
  document.getElementById('pcscreen-form').addEventListener('submit', (e) => handleSubmit(e, 'pcscreen', document.getElementById('pcscreen-error')));
});
