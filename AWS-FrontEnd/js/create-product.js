<<<<<<< HEAD
import { API_BASE_URL } from '../config/apiConfig.js';

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
      const imageFile = formData.get('imageFile');
      if (!imageFile || imageFile.size === 0) throw new Error('Image is required');

      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageBase64 = reader.result.split(',')[1];
        const productData = {
          createdAt: new Date().toISOString(),
          imageUrl: `data:image/jpeg;base64,${imageBase64}`,
        };
        formData.forEach((value, key) => {
          if (key !== 'imageFile' && value.trim() !== '') {
            productData[key] = key === 'price' ? parseFloat(value) :
                              key === 'size' || key === 'hz' || key === 'memoryStorageCapacity' || 
                              key === 'ram' || key === 'memorySize' || key === 'ssd' ? parseInt(value) : value;
          }
        });

        const response = await fetch(`${API_BASE_URL}/api/products/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: JSON.stringify(productData) }),
        });
        if (!response.ok) throw new Error(`Failed to add ${type}`);
        submitBtn.disabled = false;
        submitBtn.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        form.closest('.modal').style.display = 'none';
        form.reset();
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      errorDiv.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
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
=======
import { API_BASE_URL } from '../config/apiConfig.js';

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
      const imageFile = formData.get('imageFile');
      if (!imageFile || imageFile.size === 0) throw new Error('Image is required');

      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageBase64 = reader.result.split(',')[1];
        const productData = {
          createdAt: new Date().toISOString(),
          imageUrl: `data:image/jpeg;base64,${imageBase64}`,
        };
        formData.forEach((value, key) => {
          if (key !== 'imageFile') {
            productData[key] = key === 'price' ? parseFloat(value) : key === 'size' ? parseInt(value) : value;
          }
        });

        const response = await fetch(`${API_BASE_URL}/api/products/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: JSON.stringify(productData) }),
        });
        if (!response.ok) throw new Error(`Failed to add ${type}`);
        submitBtn.disabled = false;
        submitBtn.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        form.closest('.modal').style.display = 'none';
        form.reset();
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      errorDiv.textContent = err.message;
      submitBtn.disabled = false;
      submitBtn.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
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
>>>>>>> 6faa187b32e91321c2bdb8e6a3aae0e9e89e36c6
});