// Harvest Hub About Page
class AboutPage {
    constructor() {
        this.cart = [];
        this.currentUser = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadCart();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('closeLoginModal').addEventListener('click', () => this.hideModal('loginModal'));
        document.getElementById('cartBtn').addEventListener('click', () => this.showModal('cartModal'));
        document.getElementById('closeCartModal').addEventListener('click', () => this.hideModal('cartModal'));

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed')) {
                e.target.classList.add('hidden');
            }
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    // Cart functionality
    loadCart() {
        const savedCart = localStorage.getItem('harvestHubCart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCart();
        }
    }

    updateCart() {
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        document.getElementById('cartCount').textContent = totalItems;
        this.renderCart();
        localStorage.setItem('harvestHubCart', JSON.stringify(this.cart));
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
            cartTotal.textContent = '$0.00';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${item.name}</h4>
                    <p class="text-sm text-gray-600">${item.producer_name}</p>
                    <p class="text-sm text-gray-500">$${item.price.toFixed(2)} per ${item.unit}</p>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-900">$${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                    <p class="text-sm text-gray-500">Qty: ${item.quantity || 1}</p>
                </div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const user = await response.json();
                this.currentUser = user;
                this.hideModal('loginModal');
                this.showNotification('Successfully logged in!');
                this.updateUserInterface();
            } else {
                this.showNotification('Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    updateUserInterface() {
        if (this.currentUser) {
            document.getElementById('loginBtn').textContent = this.currentUser.first_name;
            document.getElementById('loginBtn').classList.remove('bg-primary');
            document.getElementById('loginBtn').classList.add('bg-secondary');
        } else {
            document.getElementById('loginBtn').textContent = 'Sign In';
            document.getElementById('loginBtn').classList.remove('bg-secondary');
            document.getElementById('loginBtn').classList.add('bg-primary');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the about page
const aboutPage = new AboutPage(); 