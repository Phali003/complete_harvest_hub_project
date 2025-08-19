// Harvest Hub Categories Page
class CategoriesPage {
    constructor() {
        this.cart = [];
        this.currentUser = null;
        this.categories = [];
        this.products = [];
        this.currentCategory = null;
        this.currentProducer = null;
        this.currentProducts = []; // Current filtered/displayed products

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.loadCart();
        this.renderCategories();
        
        // Check for producer filter in URL
        this.checkProducerFilter();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('closeLoginModal').addEventListener('click', () => this.hideModal('loginModal'));
        document.getElementById('cartBtn').addEventListener('click', () => this.showModal('cartModal'));
        document.getElementById('closeCartModal').addEventListener('click', () => this.hideModal('cartModal'));

        // Forms
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('producerFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('priceFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('sortBtn').addEventListener('click', () => this.toggleSort());

        // Navigation
        document.getElementById('backToCategories').addEventListener('click', () => this.showCategories());
        
        // Checkout
        document.getElementById('checkoutBtn').addEventListener('click', () => this.proceedToCheckout());

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

    async loadData() {
        try {
            console.log('Loading categories and products...');
            this.loadMockData();
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadMockData();
        }
    }

    loadMockData() {
        // Mock categories - Updated counts to reflect actual available products
        this.categories = [
            { id: 1, name: 'Vegetables', icon: '🥬', description: 'Fresh local vegetables', productCount: 17 },
            { id: 2, name: 'Fruits', icon: '🍎', description: 'Seasonal fruits', productCount: 18 },
            { id: 3, name: 'Dairy', icon: '🥛', description: 'Fresh dairy products', productCount: 17 },
            { id: 4, name: 'Baked Goods', icon: '🥖', description: 'Artisan breads and pastries', productCount: 17 },
            { id: 5, name: 'Meat & Poultry', icon: '🍗', description: 'Farm-raised meat', productCount: 16 },
            { id: 6, name: 'Grains', icon: '🌾', description: 'Whole grains and cereals', productCount: 15 },
            { id: 7, name: 'Herbs & Spices', icon: '🌿', description: 'Fresh herbs and spices', productCount: 2 },
            { id: 8, name: 'Honey & Syrups', icon: '🍯', description: 'Natural sweeteners', productCount: 3 },
            { id: 9, name: 'Eggs', icon: '🥚', description: 'Farm fresh eggs', productCount: 15 },
            { id: 10, name: 'Beverages', icon: '🥤', description: 'Fresh juices and drinks', productCount: 14 }
        ];

        // Mock products - expanded to include products for all producers
        this.products = [
            // Green Valley Farm (ID: 1) - Vegetables & Herbs
            {
                id: 1,
                name: "Organic Tomatoes",
                description: "Fresh, vine-ripened organic tomatoes",
                price: 3.99,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 2,
                name: "Mixed Greens",
                description: "Fresh mixed salad greens",
                price: 2.99,
                unit: "bag",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 3,
                name: "Fresh Carrots",
                description: "Sweet organic carrots",
                price: 1.99,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 4,
                name: "Fresh Basil",
                description: "Aromatic fresh basil",
                price: 2.99,
                unit: "bunch",
                producer_name: "Green Valley Farm",
                category: "Herbs & Spices",
                image: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 5,
                name: "Fresh Rosemary",
                description: "Aromatic rosemary sprigs",
                price: 3.49,
                unit: "bunch",
                producer_name: "Green Valley Farm",
                category: "Herbs & Spices",
                image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop&auto=format"
            },
            // Sunny Side Dairy (ID: 2) - Dairy
            {
                id: 6,
                name: "Fresh Milk",
                description: "Whole milk from grass-fed cows",
                price: 4.50,
                unit: "gallon",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 7,
                name: "Aged Cheddar",
                description: "Sharp aged cheddar cheese",
                price: 8.99,
                unit: "lb",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 8,
                name: "Greek Yogurt",
                description: "Creamy Greek yogurt",
                price: 5.99,
                unit: "quart",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 9,
                name: "Butter",
                description: "Fresh churned butter",
                price: 4.99,
                unit: "lb",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop&auto=format"
            },
            // Baker's Corner (ID: 3) - Baked Goods
            {
                id: 10,
                name: "Sourdough Bread",
                description: "Traditional sourdough bread with crispy crust",
                price: 5.99,
                unit: "loaf",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 11,
                name: "Artisan Croissants",
                description: "Buttery, flaky croissants",
                price: 3.99,
                unit: "each",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 12,
                name: "Whole Wheat Bread",
                description: "Nutritious whole wheat bread",
                price: 4.49,
                unit: "loaf",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 13,
                name: "Chocolate Chip Cookies",
                description: "Homemade chocolate chip cookies",
                price: 2.99,
                unit: "dozen",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop&auto=format"
            },
            // Fresh Fields Orchard (ID: 4) - Fruits
            {
                id: 14,
                name: "Fresh Apples",
                description: "Crisp, juicy apples from our orchard",
                price: 2.49,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=300&h=300&fit=crop"
            },
            {
                id: 15,
                name: "Strawberries",
                description: "Sweet, ripe strawberries",
                price: 4.99,
                unit: "pint",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop"
            },
            {
                id: 16,
                name: "Blueberries",
                description: "Fresh wild blueberries",
                price: 5.99,
                unit: "pint",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300&h=300&fit=crop"
            },
            {
                id: 17,
                name: "Peaches",
                description: "Juicy ripe peaches",
                price: 3.99,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop"
            },
            // Mountain Honey Co. (ID: 5) - Honey & Syrups
            {
                id: 18,
                name: "Raw Honey",
                description: "Pure raw honey from local bees",
                price: 12.99,
                unit: "jar",
                producer_name: "Mountain Honey Co.",
                category: "Honey & Syrups",
                image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop"
            },
            {
                id: 19,
                name: "Maple Syrup",
                description: "Pure maple syrup from our trees",
                price: 15.99,
                unit: "bottle",
                producer_name: "Mountain Honey Co.",
                category: "Honey & Syrups",
                image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop"
            },
            {
                id: 20,
                name: "Honey Comb",
                description: "Fresh honey comb",
                price: 18.99,
                unit: "piece",
                producer_name: "Mountain Honey Co.",
                category: "Honey & Syrups",
                image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop"
            },
            // Heritage Poultry Farm (ID: 6) - Meat & Poultry, Eggs
            {
                id: 21,
                name: "Free-Range Chicken",
                description: "Whole free-range chicken",
                price: 24.99,
                unit: "bird",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 22,
                name: "Fresh Eggs",
                description: "Farm fresh eggs from free-range chickens",
                price: 5.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 23,
                name: "Turkey Breast",
                description: "Fresh turkey breast",
                price: 18.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 24,
                name: "Duck Eggs",
                description: "Fresh duck eggs",
                price: 12.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 25,
                name: "Chicken Thighs",
                description: "Fresh chicken thighs",
                price: 8.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            
            // EXPANDED PRODUCTS TO MEET MINIMUM 13+ PER CATEGORY
            // Additional Vegetables - Green Valley Farm
            {
                id: 26,
                name: "Organic Spinach",
                description: "Fresh organic spinach leaves",
                price: 2.49,
                unit: "bag",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 27,
                name: "Bell Peppers",
                description: "Colorful organic bell peppers",
                price: 3.49,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 28,
                name: "Zucchini",
                description: "Fresh organic zucchini",
                price: 2.99,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 29,
                name: "Broccoli",
                description: "Fresh organic broccoli heads",
                price: 2.79,
                unit: "head",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 30,
                name: "Cauliflower",
                description: "Fresh organic cauliflower",
                price: 3.29,
                unit: "head",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1568584711075-3d019859dc59?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 31,
                name: "Red Onions",
                description: "Sweet red onions",
                price: 1.99,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 32,
                name: "Kale",
                description: "Nutrient-rich organic kale",
                price: 2.89,
                unit: "bunch",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 33,
                name: "Sweet Potatoes",
                description: "Orange sweet potatoes",
                price: 2.49,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 34,
                name: "Cucumber",
                description: "Crisp organic cucumbers",
                price: 1.79,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 35,
                name: "Radishes",
                description: "Peppery fresh radishes",
                price: 1.99,
                unit: "bunch",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 36,
                name: "Green Beans",
                description: "Fresh green beans",
                price: 3.49,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 37,
                name: "Corn",
                description: "Sweet corn on the cob",
                price: 4.99,
                unit: "dozen",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 38,
                name: "Beets",
                description: "Fresh organic beets",
                price: 2.99,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1590621680477-2c290a1cdb64?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 39,
                name: "Butternut Squash",
                description: "Sweet butternut squash",
                price: 1.89,
                unit: "lb",
                producer_name: "Green Valley Farm",
                category: "Vegetables",
                image: "https://images.unsplash.com/photo-1591784095916-3a8e2c6f9193?w=300&h=300&fit=crop&auto=format"
            },
            
            // Additional Fruits - Fresh Fields Orchard
            {
                id: 40,
                name: "Pears",
                description: "Sweet, juicy pears",
                price: 3.29,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1516558246042-3d57d1d1e213?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 41,
                name: "Cherries",
                description: "Sweet red cherries",
                price: 6.99,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 42,
                name: "Grapes",
                description: "Sweet seedless grapes",
                price: 4.49,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1537640538966-79f369143715?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 43,
                name: "Plums",
                description: "Ripe purple plums",
                price: 3.99,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1588595936657-93b5b6dbdbf8?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 44,
                name: "Raspberries",
                description: "Fresh red raspberries",
                price: 5.99,
                unit: "pint",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1577003833619-76beb1798d5b?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 45,
                name: "Blackberries",
                description: "Sweet blackberries",
                price: 5.99,
                unit: "pint",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1529258283598-8d6fe60b27f4?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 46,
                name: "Watermelon",
                description: "Sweet, juicy watermelon",
                price: 8.99,
                unit: "whole",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 47,
                name: "Cantaloupe",
                description: "Sweet cantaloupe melon",
                price: 4.99,
                unit: "whole",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 48,
                name: "Honeydew",
                description: "Sweet honeydew melon",
                price: 4.99,
                unit: "whole",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 49,
                name: "Apricots",
                description: "Sweet fresh apricots",
                price: 4.29,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 50,
                name: "Nectarines",
                description: "Juicy ripe nectarines",
                price: 4.49,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 51,
                name: "Lemons",
                description: "Fresh organic lemons",
                price: 3.99,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1590005354167-6da97870c757?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 52,
                name: "Limes",
                description: "Fresh organic limes",
                price: 4.99,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1590005354167-6da97870c757?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 53,
                name: "Oranges",
                description: "Sweet navel oranges",
                price: 3.49,
                unit: "lb",
                producer_name: "Fresh Fields Orchard",
                category: "Fruits",
                image: "https://images.unsplash.com/photo-1590005354167-6da97870c757?w=300&h=300&fit=crop&auto=format"
            },
            
            // Additional Dairy Products - Sunny Side Dairy
            {
                id: 54,
                name: "Mozzarella Cheese",
                description: "Fresh mozzarella cheese",
                price: 7.99,
                unit: "lb",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 55,
                name: "Swiss Cheese",
                description: "Aged Swiss cheese",
                price: 9.99,
                unit: "lb",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 56,
                name: "Gouda Cheese",
                description: "Creamy aged gouda",
                price: 11.99,
                unit: "lb",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 57,
                name: "Cream Cheese",
                description: "Smooth cream cheese",
                price: 4.49,
                unit: "8oz",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 58,
                name: "Heavy Cream",
                description: "Rich heavy cream",
                price: 3.99,
                unit: "pint",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 59,
                name: "Sour Cream",
                description: "Tangy sour cream",
                price: 3.49,
                unit: "pint",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 60,
                name: "Cottage Cheese",
                description: "Low-fat cottage cheese",
                price: 4.99,
                unit: "container",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 61,
                name: "Ricotta Cheese",
                description: "Fresh ricotta cheese",
                price: 5.99,
                unit: "container",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 62,
                name: "Buttermilk",
                description: "Fresh cultured buttermilk",
                price: 3.79,
                unit: "quart",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 63,
                name: "Whole Milk",
                description: "Rich whole milk",
                price: 3.99,
                unit: "half gallon",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 64,
                name: "2% Milk",
                description: "Reduced fat milk",
                price: 3.79,
                unit: "half gallon",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 65,
                name: "Vanilla Yogurt",
                description: "Creamy vanilla yogurt",
                price: 4.99,
                unit: "quart",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 66,
                name: "Strawberry Yogurt",
                description: "Sweet strawberry yogurt",
                price: 4.99,
                unit: "quart",
                producer_name: "Sunny Side Dairy",
                category: "Dairy",
                image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop&auto=format"
            },
            
            // Additional Baked Goods - Baker's Corner
            {
                id: 67,
                name: "Rye Bread",
                description: "Traditional rye bread",
                price: 4.99,
                unit: "loaf",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 68,
                name: "Bagels",
                description: "Fresh baked bagels",
                price: 5.99,
                unit: "dozen",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1555992336-03a23c2c4405?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 69,
                name: "Muffins",
                description: "Blueberry muffins",
                price: 7.99,
                unit: "6-pack",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 70,
                name: "Danish Pastries",
                description: "Sweet Danish pastries",
                price: 3.99,
                unit: "each",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 71,
                name: "Scones",
                description: "English-style scones",
                price: 2.99,
                unit: "each",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 72,
                name: "Cinnamon Rolls",
                description: "Sweet cinnamon rolls with icing",
                price: 8.99,
                unit: "6-pack",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 73,
                name: "Dinner Rolls",
                description: "Soft dinner rolls",
                price: 4.99,
                unit: "dozen",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 74,
                name: "Focaccia Bread",
                description: "Herb focaccia bread",
                price: 6.99,
                unit: "loaf",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 75,
                name: "Apple Pie",
                description: "Homemade apple pie",
                price: 12.99,
                unit: "whole",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1535920527002-b35e96722759?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 76,
                name: "Brownies",
                description: "Fudgy chocolate brownies",
                price: 6.99,
                unit: "9-pack",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 77,
                name: "Pita Bread",
                description: "Fresh pita bread",
                price: 3.99,
                unit: "6-pack",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 78,
                name: "Biscuits",
                description: "Buttermilk biscuits",
                price: 4.99,
                unit: "dozen",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            {
                id: 79,
                name: "French Bread",
                description: "Classic French baguette",
                price: 3.49,
                unit: "loaf",
                producer_name: "Baker's Corner",
                category: "Baked Goods",
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop&auto=format"
            },
            
            // Additional Meat & Poultry - Heritage Poultry Farm
            {
                id: 80,
                name: "Chicken Wings",
                description: "Fresh chicken wings",
                price: 7.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 81,
                name: "Chicken Breast",
                description: "Boneless chicken breast",
                price: 12.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 82,
                name: "Ground Turkey",
                description: "Lean ground turkey",
                price: 8.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 83,
                name: "Duck Breast",
                description: "Premium duck breast",
                price: 19.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 84,
                name: "Cornish Hens",
                description: "Whole Cornish game hens",
                price: 8.99,
                unit: "each",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 85,
                name: "Turkey Drumsticks",
                description: "Fresh turkey drumsticks",
                price: 6.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 86,
                name: "Chicken Drumsticks",
                description: "Fresh chicken drumsticks",
                price: 5.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 87,
                name: "Whole Turkey",
                description: "Fresh whole turkey",
                price: 49.99,
                unit: "bird",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 88,
                name: "Ground Chicken",
                description: "Fresh ground chicken",
                price: 7.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 89,
                name: "Chicken Tenders",
                description: "Fresh chicken tenders",
                price: 11.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 90,
                name: "Turkey Wings",
                description: "Fresh turkey wings",
                price: 4.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 91,
                name: "Chicken Legs",
                description: "Fresh chicken leg quarters",
                price: 3.99,
                unit: "lb",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            {
                id: 92,
                name: "Whole Duck",
                description: "Fresh whole duck",
                price: 39.99,
                unit: "bird",
                producer_name: "Heritage Poultry Farm",
                category: "Meat & Poultry",
                image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop"
            },
            
            // Additional Eggs - Heritage Poultry Farm
            {
                id: 93,
                name: "Quail Eggs",
                description: "Delicate quail eggs",
                price: 8.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 94,
                name: "Goose Eggs",
                description: "Large goose eggs",
                price: 18.99,
                unit: "half dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 95,
                name: "Brown Eggs - Large",
                description: "Large brown eggs",
                price: 6.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 96,
                name: "White Eggs - Large",
                description: "Large white eggs",
                price: 5.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 97,
                name: "Jumbo Eggs",
                description: "Extra large jumbo eggs",
                price: 7.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 98,
                name: "Medium Eggs",
                description: "Fresh medium eggs",
                price: 5.49,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 99,
                name: "Pasture Raised Eggs",
                description: "Premium pasture raised eggs",
                price: 8.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 100,
                name: "Organic Eggs",
                description: "Certified organic eggs",
                price: 9.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 101,
                name: "Free Range Eggs",
                description: "Free range chicken eggs",
                price: 7.49,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 102,
                name: "Duck Eggs - Large",
                description: "Large duck eggs",
                price: 13.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 103,
                name: "Turkey Eggs",
                description: "Fresh turkey eggs",
                price: 15.99,
                unit: "half dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 104,
                name: "Guinea Hen Eggs",
                description: "Unique guinea hen eggs",
                price: 12.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            },
            {
                id: 105,
                name: "Small Eggs",
                description: "Fresh small eggs",
                price: 4.99,
                unit: "dozen",
                producer_name: "Heritage Poultry Farm",
                category: "Eggs",
                image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
            }
        ];
    }

    renderCategories() {
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = this.categories.map(category => `
            <div class="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                 onclick="categoriesPage.showCategory('${category.name}')">
                <div class="text-4xl mb-3">${category.icon}</div>
                <h3 class="font-semibold text-gray-900 mb-2">${category.name}</h3>
                <p class="text-sm text-gray-600 mb-3">${category.description}</p>
                <span class="text-xs text-primary font-medium">${category.productCount} products</span>
            </div>
        `).join('');
    }

    showCategory(categoryName) {
        this.currentCategory = categoryName;
        this.currentProducer = null; // Reset producer filter
        const categoryProducts = this.products.filter(product => product.category === categoryName);
        this.currentProducts = [...categoryProducts]; // Store current products for filtering
        
        // Hide categories, show products
        document.getElementById('categoriesGrid').parentElement.parentElement.style.display = 'none';
        document.getElementById('productsSection').style.display = 'block';
        
        // Update title and count
        document.getElementById('categoryTitle').textContent = categoryName;
        document.getElementById('productCount').textContent = `Showing ${categoryProducts.length} products`;
        
        // Render products
        this.renderProducts(categoryProducts);
    }

    showCategories() {
        // Show categories, hide products
        document.getElementById('categoriesGrid').parentElement.parentElement.style.display = 'block';
        document.getElementById('productsSection').style.display = 'none';
        
        // Reset filters
        document.getElementById('producerFilter').value = '';
        document.getElementById('priceFilter').value = '';
        document.getElementById('searchInput').value = '';
    }

    renderProducts(productsToShow) {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = productsToShow.map(product => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div class="h-48 bg-gray-200 overflow-hidden">
                    <img src="${product.image}" alt="${product.name}"
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>

                <div class="p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-gray-900 text-lg">${product.name}</h3>
                        <span class="text-sm text-gray-500">${product.category}</span>
                    </div>

                    <p class="text-gray-600 text-sm mb-3">${product.description}</p>

                    <div class="flex items-center justify-between mb-3">
                        <span class="text-lg font-bold text-primary">$${product.price.toFixed(2)}</span>
                        <span class="text-sm text-gray-500">per ${product.unit}</span>
                    </div>

                    <p class="text-sm text-gray-600 mb-4">by ${product.producer_name}</p>

                    <button onclick="categoriesPage.addToCart(${product.id})"
                            class="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    handleSearch(query) {
        console.log('handleSearch called with:', query);
        
        if (query.length < 2) {
            this.renderProducts(this.currentProducts);
            return;
        }

        const filteredProducts = this.currentProducts.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.producer_name.toLowerCase().includes(query.toLowerCase())
        );

        console.log('Search filtered products:', filteredProducts.length);
        this.renderProducts(filteredProducts);
    }

    applyFilters() {
        console.log('applyFilters called');
        
        const producerFilter = document.getElementById('producerFilter').value;
        const priceFilter = document.getElementById('priceFilter').value;
        
        console.log('Filters:', { producer: producerFilter, price: priceFilter, currentProducer: this.currentProducer, currentCategory: this.currentCategory });
        
        // Start with the base products depending on the current view
        let filteredProducts;
        
        if (producerFilter) {
            // If a producer is selected, get ALL products from that producer (regardless of current view)
            filteredProducts = this.products.filter(product => product.producer_name === producerFilter);
            console.log(`Filtering by producer: ${producerFilter}, found ${filteredProducts.length} products`);
        } else {
            // No producer filter, use current products (category or producer view)
            filteredProducts = [...this.currentProducts];
        }
        
        // Apply price filter
        if (priceFilter) {
            if (priceFilter.includes('+')) {
                // Handle "20+" format
                const min = parseFloat(priceFilter.replace('+', ''));
                filteredProducts = filteredProducts.filter(product => product.price >= min);
            } else {
                // Handle "5-10" format
                const [min, max] = priceFilter.split('-').map(Number);
                if (max) {
                    filteredProducts = filteredProducts.filter(product => product.price >= min && product.price <= max);
                } else {
                    filteredProducts = filteredProducts.filter(product => product.price >= min);
                }
            }
        }
        
        console.log('Final filtered products:', filteredProducts.length);
        this.renderProducts(filteredProducts);
        
        // Update count
        const productCountElement = document.getElementById('productCount');
        if (productCountElement) {
            let baseText;
            if (producerFilter) {
                baseText = `from ${producerFilter}`;
            } else if (this.currentProducer) {
                baseText = `from ${this.currentProducer}`;
            } else if (this.currentCategory) {
                baseText = `in ${this.currentCategory}`;
            } else {
                baseText = 'products';
            }
            productCountElement.textContent = `Showing ${filteredProducts.length} ${baseText}`;
        }
    }

    toggleSort() {
        console.log('toggleSort called');
        
        const sortBtn = document.getElementById('sortBtn');
        const isSorted = sortBtn.classList.contains('bg-white');
        
        let productsToSort = [...this.currentProducts];
        
        if (isSorted) {
            // Reset to original order
            sortBtn.classList.remove('bg-white', 'text-gray-800');
            sortBtn.classList.add('bg-white/20', 'text-white');
            sortBtn.innerHTML = '<i class="fas fa-sort mr-2"></i>Sort by Price';
            console.log('Reset to original order');
        } else {
            // Sort by price
            productsToSort.sort((a, b) => a.price - b.price);
            sortBtn.classList.remove('bg-white/20', 'text-white');
            sortBtn.classList.add('bg-white', 'text-gray-800');
            sortBtn.innerHTML = '<i class="fas fa-sort-up mr-2"></i>Sorted by Price';
            console.log('Sorted by price');
        }
        
        this.renderProducts(productsToSort);
        
        // Update count
        const productCountElement = document.getElementById('productCount');
        if (productCountElement) {
            const baseText = this.currentProducer ? `from ${this.currentProducer}` : 'products';
            productCountElement.textContent = `Showing ${productsToSort.length} products ${baseText}`;
        }
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
                <div class="flex items-center space-x-3">
                    <div class="flex items-center space-x-2">
                        <button onclick="categoriesPage.decrementQuantity(${item.id})" 
                                class="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                            <i class="fas fa-minus text-sm"></i>
                        </button>
                        <span class="w-8 text-center font-semibold text-gray-900">${item.quantity || 1}</span>
                        <button onclick="categoriesPage.incrementQuantity(${item.id})" 
                                class="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-full flex items-center justify-center transition-colors">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-gray-900">$${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                        <button onclick="categoriesPage.removeFromCart(${item.id})" 
                                class="text-xs text-red-500 hover:text-red-700 transition-colors">
                            <i class="fas fa-trash mr-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.updateCart();
        this.showNotification(`${product.name} added to cart!`);
    }

    incrementQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = (item.quantity || 1) + 1;
            this.updateCart();
        }
    }

    decrementQuantity(productId) {
        const item = this.cart.find(item => item.id === productId);
        if (item && (item.quantity || 1) > 1) {
            item.quantity = (item.quantity || 1) - 1;
            this.updateCart();
        }
    }

    removeFromCart(productId) {
        const itemIndex = this.cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            const item = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.updateCart();
            this.showNotification(`${item.name} removed from cart!`, 'success');
        }
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

    checkProducerFilter() {
        const urlParams = new URLSearchParams(window.location.search);
        const producerId = urlParams.get('producer');
        
        if (producerId) {
            // Find the producer and show their products
            const producer = this.getProducerById(parseInt(producerId));
            if (producer) {
                this.showProducerProducts(producer);
            }
        }
    }

    getProducerById(producerId) {
        // Mock producer data - matching exactly with producers.js
        const producers = [
            { id: 1, name: "Green Valley Farm", categories: ["Vegetables", "Herbs & Spices"] },
            { id: 2, name: "Sunny Side Dairy", categories: ["Dairy", "Eggs"] },
            { id: 3, name: "Baker's Corner", categories: ["Baked Goods"] },
            { id: 4, name: "Mountain Honey Co.", categories: ["Honey & Syrups"] },
            { id: 5, name: "Fresh Fields Orchard", categories: ["Fruits"] },
            { id: 6, name: "Heritage Poultry Farm", categories: ["Meat & Poultry", "Eggs"] }
        ];
        
        return producers.find(p => p.id === producerId);
    }

    showProducerProducts(producer) {
        // Filter products by producer
        const producerProducts = this.products.filter(product => 
            product.producer_name === producer.name
        );

        if (producerProducts.length === 0) {
            this.showNotification(`No products found for ${producer.name}`, 'error');
            return;
        }

        // Set current state for producer view
        this.currentCategory = null; // Clear category filter
        this.currentProducer = producer.name;
        this.currentProducts = [...producerProducts]; // Store current products for filtering

        // Hide categories grid and show products section
        const categoriesGrid = document.getElementById('categoriesGrid');
        if (categoriesGrid && categoriesGrid.parentElement && categoriesGrid.parentElement.parentElement) {
            categoriesGrid.parentElement.parentElement.style.display = 'none';
        }
        
        const productsSection = document.getElementById('productsSection');
        if (productsSection) {
            productsSection.style.display = 'block';
        }
        
        // Update section title
        const categoryTitle = document.getElementById('categoryTitle');
        if (categoryTitle) {
            categoryTitle.textContent = `Products from ${producer.name}`;
        }
        
        // Update product count
        const productCount = document.getElementById('productCount');
        if (productCount) {
            productCount.textContent = `Showing ${producerProducts.length} products from ${producer.name}`;
        }
        
        // Render products
        this.renderProducts(producerProducts);
        
        console.log(`Loaded ${producerProducts.length} products for ${producer.name}`);
    }

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }

        // Close the cart modal
        this.hideModal('cartModal');
        
        // Show loading notification
        this.showNotification('Proceeding to checkout...');
        
        // Redirect to checkout page after a brief delay
        setTimeout(() => {
            window.location.href = 'checkout.html';
        }, 500);
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

// Initialize the categories page
const categoriesPage = new CategoriesPage(); 