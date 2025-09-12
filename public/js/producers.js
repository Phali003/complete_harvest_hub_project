// Harvest Hub Producers Page
class ProducersPage {
    constructor() {
        this.cart = [];
        this.currentUser = null;
        this.producers = [];
        this.filteredProducers = [];
        this.currentView = 'grid';
        this.currentPage = 1;
        this.producersPerPage = 9;

        this.init();
    }

    async init() {
        // Guard: only allow producers to access this page
        const role = localStorage.getItem('harvestHubRole');
        if (role !== 'producer') {
            window.location.replace('/');
            return;
        }
        // Apply stored display name immediately on page load
        this.updateUserInterface();
        this.setupEventListeners();
        await this.loadProducers();
        this.loadCart();
        this.renderProducers();
        this.updateProducerCount();
    }

    setupEventListeners() {
        // Modal controls (login button shows logout prompt when already signed in)
        document.getElementById('loginBtn').addEventListener('click', (e) => {
            const hasToken = !!localStorage.getItem('harvestHubToken');
            const hasName = !!localStorage.getItem('harvestHubDisplayName');
            if (hasToken || this.currentUser || hasName) {
                this.promptLogout(e.currentTarget);
            } else {
                this.showModal('loginModal');
            }
        });
        document.getElementById('closeLoginModal').addEventListener('click', () => this.hideModal('loginModal'));
        document.getElementById('cartBtn').addEventListener('click', () => this.showModal('cartModal'));
        document.getElementById('closeCartModal').addEventListener('click', () => this.hideModal('cartModal'));

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('ratingFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBtn').addEventListener('click', () => this.toggleSort());

        // View toggles
        document.getElementById('gridViewBtn').addEventListener('click', () => this.switchToGridView());
        document.getElementById('listViewBtn').addEventListener('click', () => this.switchToListView());

        // Load more
        document.getElementById('loadMoreBtn').addEventListener('click', () => this.loadMoreProducers());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed')) {
                e.target.classList.add('hidden');
            }
        });
    }

    // Logout popover (mirrors app.js behavior)
    promptLogout(anchorEl) {
        const existing = document.getElementById('logoutPopover');
        if (existing) existing.remove();

        const rect = anchorEl.getBoundingClientRect();
        const popover = document.createElement('div');
        popover.id = 'logoutPopover';
        popover.className = 'fixed bg-white shadow-lg rounded-md border border-gray-200 z-50';
        popover.style.top = `${rect.bottom + 8 + window.scrollY}px`;
        popover.style.left = `${rect.right - 160 + window.scrollX}px`;
        popover.style.width = '160px';
        popover.innerHTML = `
            <div class="p-3">
                <div class="text-sm text-gray-700 mb-2">You are signed in.</div>
                <button id="confirmLogoutBtn" class="w-full bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">Log out</button>
                <button id="cancelLogoutBtn" class="w-full mt-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm">Cancel</button>
            </div>
        `;
        document.body.appendChild(popover);

        const cleanup = () => {
            if (popover && popover.parentNode) popover.parentNode.removeChild(popover);
            document.removeEventListener('click', onOutsideClick, true);
        };
        const onOutsideClick = (ev) => {
            if (!popover.contains(ev.target) && ev.target !== anchorEl) {
                cleanup();
            }
        };
        document.getElementById('confirmLogoutBtn').addEventListener('click', async () => {
            await this.logout();
            cleanup();
        });
        document.getElementById('cancelLogoutBtn').addEventListener('click', cleanup);
        setTimeout(() => document.addEventListener('click', onOutsideClick, true), 0);
    }

    async logout() {
        try {
            localStorage.removeItem('harvestHubToken');
            localStorage.removeItem('harvestHubRole');
            localStorage.removeItem('harvestHubDisplayName');
            this.currentUser = null;
            this.clearUserUI();
            this.showNotification('You have been logged out.');
            window.location.href = '/';
        } catch (e) {
            console.error('Logout error:', e);
            this.showNotification('Failed to log out. Please try again.', 'error');
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    async loadProducers() {
        try {
            console.log('Loading producers...');
            // Try to load from API first, but use mock data as fallback
            this.loadMockData(); // Load mock data immediately for testing

            // Uncomment these when database is set up:
            /*
            const response = await fetch('/api/producers');
            if (response.ok) {
                this.producers = await response.json();
                this.filteredProducers = [...this.producers];
            }
            */

            console.log('Producers loaded successfully:', this.producers.length);
        } catch (error) {
            console.error('Error loading producers:', error);
            this.loadMockData();
        }
    }

    loadMockData() {
        // Mock producers data
        this.producers = [
            {
                id: 1,
                business_name: "Green Valley Farm",
                description: "Family-owned organic farm specializing in seasonal vegetables and herbs. We grow everything with love and care for the environment.",
                rating: 4.8,
                total_reviews: 127,
                address_city: "Springfield",
                address_state: "IL",
                categories: ["Vegetables", "Herbs & Spices"],
                featured_products: ["Organic Tomatoes", "Mixed Greens", "Fresh Basil"],
                image: "https://images.unsplash.com/photo-1523741543316-beb7fc7023d8?w=400&h=300&fit=crop"
            },
            {
                id: 2,
                business_name: "Sunny Side Dairy",
                description: "Artisan dairy products from grass-fed cows. We make fresh milk, cheese, yogurt, and butter using traditional methods.",
                rating: 4.9,
                total_reviews: 89,
                address_city: "Springfield",
                address_state: "IL",
                categories: ["Dairy", "Eggs"],
                featured_products: ["Fresh Milk", "Aged Cheddar", "Greek Yogurt"],
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop"
            },
            {
                id: 3,
                business_name: "Baker's Corner",
                description: "Handcrafted breads and pastries made fresh daily. We use only the finest ingredients and traditional baking techniques.",
                rating: 4.7,
                total_reviews: 156,
                address_city: "Springfield",
                address_state: "IL",
                categories: ["Baked Goods"],
                featured_products: ["Sourdough Bread", "Croissants", "Artisan Cookies"],
                image: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=400&h=300&fit=crop"
            },
            {
                id: 4,
                business_name: "Mountain Honey Co.",
                description: "Raw honey and bee products from our own apiaries. We harvest honey sustainably and offer a variety of unique flavors.",
                rating: 4.6,
                total_reviews: 73,
                address_city: "Springfield",
                address_state: "IL",
                categories: ["Honey & Syrups"],
                featured_products: ["Wildflower Honey", "Clover Honey", "Honey Comb"],
                image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop"
            },
            {
                id: 5,
                business_name: "Fresh Fields Orchard",
                description: "Family orchard growing a variety of fruits including apples, peaches, and berries. Pick your own or buy from our farm stand.",
                rating: 4.5,
                total_reviews: 94,
                address_city: "Springfield",
                address_state: "IL",
                categories: ["Fruits"],
                featured_products: ["Fresh Apples", "Peaches", "Strawberries"],
                image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=400&h=300&fit=crop"
            },
            {
                id: 6,
                business_name: "Heritage Poultry Farm",
                description: "Free-range chickens and turkeys raised without antibiotics. We offer fresh eggs and whole birds for special occasions.",
                rating: 4.4,
                total_reviews: 67,
                address_city: "Springfield",
                address_state: "IL",
                categories: ["Meat & Poultry", "Eggs"],
                featured_products: ["Fresh Eggs", "Whole Chickens", "Heritage Turkeys"],
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop"
            }
        ];

        this.filteredProducers = [...this.producers];
    }

    renderProducers() {
        if (this.currentView === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }

    renderGridView() {
        const grid = document.getElementById('producersGrid');
        const startIndex = (this.currentPage - 1) * this.producersPerPage;
        const endIndex = startIndex + this.producersPerPage;
        const producersToShow = this.filteredProducers.slice(startIndex, endIndex);

        grid.innerHTML = producersToShow.map(producer => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div class="h-48 bg-gray-200 overflow-hidden">
                    <img src="${producer.image}" alt="${producer.business_name}"
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>

                <div class="p-6">
                    <div class="flex items-start justify-between mb-3">
                        <h3 class="font-semibold text-gray-900 text-xl">${producer.business_name}</h3>
                        <div class="flex items-center">
                            <div class="flex text-yellow-400 text-sm">
                                ${this.generateStars(producer.rating)}
                            </div>
                            <span class="text-sm text-gray-600 ml-2">${producer.rating}</span>
                        </div>
                    </div>

                    <p class="text-gray-600 text-sm mb-4">${producer.description}</p>

                    <div class="flex flex-wrap gap-2 mb-4">
                        ${producer.categories.map(category => 
                            `<span class="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">${category}</span>`
                        ).join('')}
                    </div>

                    <div class="text-sm text-gray-500 mb-4">
                        <p><i class="fas fa-map-marker-alt mr-2"></i>${producer.address_city}, ${producer.address_state}</p>
                        <p><i class="fas fa-star mr-2"></i>${producer.total_reviews} reviews</p>
                    </div>

                    <div class="space-y-2 mb-4">
                        <p class="text-xs text-gray-500 font-medium">Featured Products:</p>
                        <div class="flex flex-wrap gap-1">
                            ${producer.featured_products.slice(0, 3).map(product => 
                                `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">${product}</span>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="flex space-x-2">
                        <button onclick="producersPage.viewProducer(${producer.id})"
                                class="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                            View Profile
                        </button>
                        <button onclick="producersPage.viewProducts(${producer.id})"
                                class="flex-1 bg-secondary text-white py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors">
                            View Products
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (endIndex >= this.filteredProducers.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    renderListView() {
        const list = document.getElementById('producersList');
        const startIndex = (this.currentPage - 1) * this.producersPerPage;
        const endIndex = startIndex + this.producersPerPage;
        const producersToShow = this.filteredProducers.slice(startIndex, endIndex);

        list.innerHTML = producersToShow.map(producer => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                <div class="flex items-start space-x-6">
                    <div class="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img src="${producer.image}" alt="${producer.business_name}"
                             class="w-full h-full object-cover">
                    </div>

                    <div class="flex-1">
                        <div class="flex items-start justify-between mb-3">
                            <h3 class="font-semibold text-gray-900 text-xl">${producer.business_name}</h3>
                            <div class="flex items-center">
                                <div class="flex text-yellow-400 text-sm">
                                    ${this.generateStars(producer.rating)}
                                </div>
                                <span class="text-sm text-gray-600 ml-2">${producer.rating}</span>
                            </div>
                        </div>

                        <p class="text-gray-600 text-sm mb-4">${producer.description}</p>

                        <div class="flex flex-wrap gap-2 mb-4">
                            ${producer.categories.map(category => 
                                `<span class="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">${category}</span>`
                            ).join('')}
                        </div>

                        <div class="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                            <span><i class="fas fa-map-marker-alt mr-2"></i>${producer.address_city}, ${producer.address_state}</span>
                            <span><i class="fas fa-star mr-2"></i>${producer.total_reviews} reviews</span>
                        </div>

                        <div class="flex space-x-2">
                            <button onclick="producersPage.viewProducer(${producer.id})"
                                    class="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                                View Profile
                            </button>
                            <button onclick="producersPage.viewProducts(${producer.id})"
                                    class="bg-secondary text-white py-2 px-4 rounded-md hover:bg-secondary/90 transition-colors">
                                View Products
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (endIndex >= this.filteredProducers.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
        }
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    switchToGridView() {
        this.currentView = 'grid';
        document.getElementById('producersGrid').classList.remove('hidden');
        document.getElementById('producersList').classList.add('hidden');
        document.getElementById('gridViewBtn').classList.add('bg-primary', 'text-white');
        document.getElementById('gridViewBtn').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('listViewBtn').classList.remove('bg-primary', 'text-white');
        document.getElementById('listViewBtn').classList.add('bg-gray-200', 'text-gray-700');
        this.renderProducers();
    }

    switchToListView() {
        this.currentView = 'list';
        document.getElementById('producersGrid').classList.add('hidden');
        document.getElementById('producersList').classList.remove('hidden');
        document.getElementById('listViewBtn').classList.add('bg-primary', 'text-white');
        document.getElementById('listViewBtn').classList.remove('bg-gray-200', 'text-gray-700');
        document.getElementById('gridViewBtn').classList.remove('bg-primary', 'text-white');
        document.getElementById('gridViewBtn').classList.add('bg-gray-200', 'text-gray-700');
        this.renderProducers();
    }

    handleSearch(query) {
        if (query.length < 2) {
            this.filteredProducers = [...this.producers];
        } else {
            this.filteredProducers = this.producers.filter(producer =>
                producer.business_name.toLowerCase().includes(query.toLowerCase()) ||
                producer.description.toLowerCase().includes(query.toLowerCase()) ||
                producer.categories.some(cat => cat.toLowerCase().includes(query.toLowerCase()))
            );
        }
        this.currentPage = 1;
        this.renderProducers();
        this.updateProducerCount();
    }

    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const ratingFilter = parseFloat(document.getElementById('ratingFilter').value);

        this.filteredProducers = this.producers.filter(producer => {
            const categoryMatch = !categoryFilter || producer.categories.includes(categoryFilter);
            const ratingMatch = !ratingFilter || producer.rating >= ratingFilter;
            return categoryMatch && ratingMatch;
        });

        this.currentPage = 1;
        this.renderProducers();
        this.updateProducerCount();
    }

    toggleSort() {
        const sortBtn = document.getElementById('sortBtn');
        const isSorted = sortBtn.classList.contains('bg-white');
        
        if (isSorted) {
            // Reset to original order
            this.filteredProducers = [...this.producers];
            sortBtn.classList.remove('bg-white', 'text-gray-800');
            sortBtn.classList.add('bg-white/20', 'text-white');
            sortBtn.innerHTML = '<i class="fas fa-sort mr-2"></i>Sort by Rating';
        } else {
            // Sort by rating
            this.filteredProducers.sort((a, b) => b.rating - a.rating);
            sortBtn.classList.remove('bg-white/20', 'text-white');
            sortBtn.classList.add('bg-white', 'text-gray-800');
            sortBtn.innerHTML = '<i class="fas fa-sort-up mr-2"></i>Sorted by Rating';
        }

        this.currentPage = 1;
        this.renderProducers();
    }

    loadMoreProducers() {
        this.currentPage++;
        this.renderProducers();
    }

    updateProducerCount() {
        const countElement = document.getElementById('producerCount');
        countElement.textContent = `Showing ${this.filteredProducers.length} producers`;
    }

    viewProducer(producerId) {
        // Navigate to producer detail page (to be implemented)
        console.log('Viewing producer:', producerId);
        // window.location.href = `/producer/${producerId}`;
    }

    viewProducts(producerId) {
        // Navigate to producer's products page (to be implemented)
        console.log('Viewing products for producer:', producerId);
        // window.location.href = `/producer/${producerId}/products`;
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
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
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
                    <p class="font-semibold text-gray-900">$${(item.price * item.quantity).toFixed(2)}</p>
                    <p class="text-sm text-gray-500">Qty: ${item.quantity}</p>
                </div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
        const btn = document.getElementById('loginBtn');
        if (!btn) return;
        const token = localStorage.getItem('harvestHubToken');
        const storedName = localStorage.getItem('harvestHubDisplayName');
        if (this.currentUser || token || storedName) {
            const name = (this.currentUser && (this.currentUser.first_name || this.currentUser.firstName || this.currentUser.name || this.currentUser.email)) || storedName || 'My Account';
            btn.textContent = name;
            btn.classList.remove('bg-primary');
            btn.classList.add('bg-secondary');
        } else {
            btn.textContent = 'Sign In';
            btn.classList.remove('bg-secondary');
            btn.classList.add('bg-primary');
        }
    }

    // Expose a small helper to clear UI explicitly on logout redirects (optional)
    clearUserUI() {
        const btn = document.getElementById('loginBtn');
        if (!btn) return;
        btn.textContent = 'Sign In';
        btn.classList.remove('bg-secondary');
        btn.classList.add('bg-primary');
    }

    viewProducer(producerId) {
        const producer = this.producers.find(p => p.id === producerId);
        if (!producer) {
            this.showNotification('Producer not found', 'error');
            return;
        }

        // Create and show producer profile modal
        this.showProducerProfileModal(producer);
    }

    viewProducts(producerId) {
        const producer = this.producers.find(p => p.id === producerId);
        if (!producer) {
            this.showNotification('Producer not found', 'error');
            return;
        }

        // Redirect to categories page with producer filter
        window.location.href = `/categories.html?producer=${producerId}`;
    }

    showProducerProfileModal(producer) {
        // Create modal HTML
        const modalHTML = `
            <div id="producerProfileModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <div class="relative">
                        <div class="h-64 bg-gray-200 overflow-hidden">
                            <img src="${producer.image}" alt="${producer.business_name}"
                                 class="w-full h-full object-cover">
                        </div>
                        <button onclick="producersPage.hideProducerProfileModal()"
                                class="absolute top-4 right-4 bg-white bg-opacity-80 rounded-full p-2 hover:bg-opacity-100 transition-all">
                            <i class="fas fa-times text-gray-700"></i>
                        </button>
                    </div>

                    <div class="p-6">
                        <div class="flex items-start justify-between mb-4">
                            <h2 class="text-2xl font-bold text-gray-900">${producer.business_name}</h2>
                            <div class="flex items-center">
                                <div class="flex text-yellow-400">
                                    ${this.generateStars(producer.rating)}
                                </div>
                                <span class="text-gray-600 ml-2">${producer.rating}</span>
                            </div>
                        </div>

                        <p class="text-gray-600 mb-6">${producer.description}</p>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">Location</h3>
                                <p class="text-gray-600"><i class="fas fa-map-marker-alt mr-2"></i>${producer.address_city}, ${producer.address_state}</p>
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">Reviews</h3>
                                <p class="text-gray-600"><i class="fas fa-star mr-2"></i>${producer.total_reviews} reviews</p>
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-semibold text-gray-900 mb-2">Categories</h3>
                            <div class="flex flex-wrap gap-2">
                                ${producer.categories.map(category => 
                                    `<span class="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">${category}</span>`
                                ).join('')}
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="font-semibold text-gray-900 mb-2">Featured Products</h3>
                            <div class="flex flex-wrap gap-2">
                                ${producer.featured_products.map(product => 
                                    `<span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded">${product}</span>`
                                ).join('')}
                            </div>
                        </div>

                        <div class="flex space-x-4">
                            <button onclick="producersPage.viewProducts(${producer.id}); producersPage.hideProducerProfileModal()"
                                    class="flex-1 bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors">
                                <i class="fas fa-shopping-bag mr-2"></i>View All Products
                            </button>
                            <button onclick="producersPage.hideProducerProfileModal()"
                                    class="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    hideProducerProfileModal() {
        const modal = document.getElementById('producerProfileModal');
        if (modal) {
            modal.remove();
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

// Initialize the producers page
const producersPage = new ProducersPage(); 