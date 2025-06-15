document.addEventListener('DOMContentLoaded', () => {
    // AWS Cognito Configuration
    const REGION = 'us-east-1';
    const USER_POOL_ID = 'YOUR_USER_POOL_ID'; // Replace with your Cognito User Pool ID
    const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your Cognito User Pool Client ID
    const API_URL = 'YOUR_API_GATEWAY_URL'; // Replace with your API Gateway URL, e.g., https://0dx54dy3ce.execute-api.us-east-1.amazonaws.com/test-invoke-stage

    AWS.config.region = REGION;
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'YOUR_IDENTITY_POOL_ID' // Replace with your Cognito Identity Pool ID
    });

    const userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({
        UserPoolId: USER_POOL_ID,
        ClientId: CLIENT_ID
    });

    let currentUser = userPool.getCurrentUser();
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Page Navigation
    function showPage(pageId) {
        document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');
        document.getElementById('pageTitle').textContent = {
            homePage: 'TechBay',
            productPage: 'Product Details',
            checkoutPage: 'Checkout',
            profilePage: 'User Profile',
            adminPanel: 'Admin Panel'
        }[pageId];
    }

    // Authentication
    function updateAuthButton() {
        const authBtn = document.getElementById('authBtn');
        if (currentUser) {
            authBtn.textContent = 'Logout';
            authBtn.onclick = () => {
                currentUser.signOut();
                currentUser = null;
                localStorage.removeItem('cart');
                cart = [];
                updateAuthButton();
                showPage('homePage');
                loadProducts();
            };
        } else {
            authBtn.textContent = 'Login';
            authBtn.onclick = () => {
                window.location.href = `https://${USER_POOL_ID}.auth.${REGION}.amazoncognito.com/login?client_id=${CLIENT_ID}&response_type=code&redirect_uri=https://localhost:3000/callback`;
            };
        }
    }

    // Load Products
    async function loadProducts(category = 'all') {
        try {
            const response = await axios.get(`${API_URL}/api/products`);
            const products = response.data;
            const productsGrid = document.getElementById('productsGrid');
            productsGrid.innerHTML = '';

            const filteredProducts = category === 'all' ? products : products.filter(p => p.category === category);
            filteredProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'bg-white p-4 rounded shadow cursor-pointer';
                card.innerHTML = `
                    <img src="${product.imageUrl || 'https://via.placeholder.com/150'}" alt="${product.brand || product.company}" class="w-full h-48 object-cover mb-2">
                    <h3 class="text-lg font-bold">${product.brand || product.company} ${product.modelName || product.size || ''}</h3>
                    <p class="text-gray-600">$${product.price}</p>
                `;
                card.onclick = () => showProductDetails(product);
                productsGrid.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Failed to load products');
        }
    }

    // Product Details
    async function showProductDetails(product) {
        showPage('productPage');
        const productDetails = document.getElementById('productDetails');
        productDetails.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/300'}" alt="${product.brand || product.company}" class="w-full max-w-md mx-auto mb-4">
            <h2 class="text-2xl font-bold">${product.brand || product.company} ${product.modelName || product.size || ''}</h2>
            <p class="text-gray-600">${product.description || 'No description available'}</p>
            <p class="text-lg font-semibold">$${product.price}</p>
            <p>Category: ${product.category}</p>
            ${product.memoryStorageCapacity ? `<p>Storage: ${product.memoryStorageCapacity}</p>` : ''}
            ${product.ram ? `<p>RAM: ${product.ram}</p>` : ''}
            ${product.displayResolutionMaximum ? `<p>Resolution: ${product.displayResolutionMaximum}</p>` : ''}
            ${product.hz ? `<p>Refresh Rate: ${product.hz}</p>` : ''}
            ${product.aspectRatio ? `<p>Aspect Ratio: ${product.aspectRatio}</p>` : ''}
            ${product.motherboardCompatibility ? `<p>Motherboard: ${product.motherboardCompatibility}</p>` : ''}
            ${product.ssd ? `<p>SSD: ${product.ssd}</p>` : ''}
            ${product.graphicsCard ? `<p>Graphics Card: ${product.graphicsCard}</p>` : ''}
            ${product.processor ? `<p>Processor: ${product.processor}</p>` : ''}
        `;

        const colorSelect = document.getElementById('colorSelect');
        colorSelect.innerHTML = '<option value="">Select Color</option>';
        if (product.color) {
            product.color.split(',').forEach(c => {
                const option = document.createElement('option');
                option.value = c.trim();
                option.textContent = c.trim();
                colorSelect.appendChild(option);
            });
        } else {
            colorSelect.disabled = true;
        }

        document.getElementById('addToCartBtn').onclick = () => addToCart(product);
    }

    // Add to Cart
    async function addToCart(product) {
        if (!currentUser) {
            alert('Please login to add items to cart');
            return;
        }
        const color = document.getElementById('colorSelect').value;
        try {
            await axios.post(`${API_URL}/api/cart`, {
                userId: currentUser.getUsername(),
                productId: product.productId,
                quantity: 1,
                category: product.category
            });
            cart.push({ ...product, quantity: 1, selectedColor: color });
            localStorage.setItem('cart', JSON.stringify(cart));
            alert('Item added to cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add item to cart');
        }
    }

    // Checkout Page
    function showCheckout() {
        if (!currentUser) {
            alert('Please login to checkout');
            return;
        }
        showPage('checkoutPage');
        const cartItems = document.getElementById('cartItems');
        cartItems.innerHTML = '';
        cart.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex justify-between items-center mb-4';
            itemDiv.innerHTML = `
                <div>
                    <h3 class="text-lg font-bold">${item.brand || item.company} ${item.modelName || item.size || ''}</h3>
                    <p>$${item.price} x ${item.quantity}</p>
                    ${item.selectedColor ? `<p>Color: ${item.selectedColor}</p>` : ''}
                </div>
                <p class="font-semibold">$${item.price * item.quantity}</p>
            `;
            cartItems.appendChild(itemDiv);
        });
        document.getElementById('placeOrderBtn').onclick = placeOrder;
    }

    // Place Order
    async function placeOrder() {
        if (!currentUser) {
            alert('Please login to place order');
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/api/checkout`, {}, {
                headers: { Authorization: `Bearer ${currentUser.getSignInUserSession().getIdToken().getJwtToken()}` }
            });
            alert(response.data.message);
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            showPage('homePage');
            loadProducts();
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order');
        }
    }

    // User Profile
    async function showUserProfile() {
        if (!currentUser) {
            alert('Please login to view profile');
            return;
        }
        showPage('profilePage');
        try {
            const userResponse = await axios.get(`${API_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${currentUser.getSignInUserSession().getIdToken().getJwtToken()}` }
            });
            const userProfile = document.getElementById('userProfile');
            userProfile.innerHTML = `
                <p><strong>User ID:</strong> ${userResponse.data.userId}</p>
                <p><strong>Email:</strong> ${userResponse.data.email || 'N/A'}</p>
                <p><strong>Role:</strong> ${userResponse.data.role || 'User'}</p>
            `;

            // Fetch past orders (mocked as API may not exist)
            const orders = []; // Replace with actual API call if available
            const pastOrders = document.getElementById('pastOrders');
            pastOrders.innerHTML = '';
            orders.forEach(order => {
                order.items.forEach(item => {
                    const orderDiv = document.createElement('div');
                    orderDiv.className = 'mb-4';
                    orderDiv.innerHTML = `
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Product:</strong> ${item.brand || item.company} ${item.modelName || item.size || ''}</p>
                        <p><strong>Category:</strong> ${item.category}</p>
                        <p><strong>Quantity:</strong> ${item.quantity}</p>
                        <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                    `;
                    pastOrders.appendChild(orderDiv);
                });
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            alert('Failed to load profile');
        }
    }

    // Admin Panel
    async function showAdminPanel() {
        if (!currentUser || currentUser.getSignInUserSession().getIdToken().payload['cognito:groups']?.includes('Admin') !== true) {
            alert('Access denied: Admin only');
            return;
        }
        showPage('adminPanel');
        try {
            // Mocked users data (replace with actual API call)
            const users = []; // Replace with API to fetch users
            const usersTable = document.getElementById('usersTable');
            usersTable.innerHTML = '';
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border p-2">${user.userId}</td>
                    <td class="border p-2">${user.email}</td>
                    <td class="border p-2">${user.role || 'User'}</td>
                `;
                usersTable.appendChild(row);
            });

            // Mocked orders data (replace with actual API call)
            const orders = []; // Replace with API to fetch orders
            const ordersTable = document.getElementById('ordersTable');
            ordersTable.innerHTML = '';
            orders.forEach(order => {
                order.items.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="border p-2">${order.orderId}</td>
                        <td class="border p-2">${order.userId}</td>
                        <td class="border p-2">${item.brand || item.company} ${item.modelName || item.size || ''}</td>
                        <td class="border p-2">${item.category}</td>
                        <td class="border p-2">${item.quantity}</td>
                        <td class="border p-2">${new Date(order.orderDate).toLocaleString()}</td>
                    `;
                    ordersTable.appendChild(row);
                });
            });
        } catch (error) {
            console.error('Error loading admin panel:', error);
            alert('Failed to load admin panel');
        }
    }

    // Initialize
    document.getElementById('backBtn').addEventListener('click', () => history.back());
    updateAuthButton();
    showPage('homePage');
    loadProducts();

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => loadProducts(btn.dataset.category));
    });

    document.getElementById('checkoutBtn').addEventListener('click', showCheckout);
    document.getElementById('pageTitle').addEventListener('click', () => {
        showPage('homePage');
        loadProducts();
    });

    document.getElementById('profileBtn').addEventListener('click', showUserProfile);
    document.getElementById('adminBtn').addEventListener('click', showAdminPanel);
});