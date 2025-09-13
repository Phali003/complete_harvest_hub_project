const API_BASE_URL = "https://harvest-hub-8xn4.onrender.com";

class HarvestHub {
  constructor() {
    this.cart = [];
    this.currentUser = null;
    this.categories = [];
    this.producers = [];
    this.products = [];

    this.init();
  }

  async init() {
    console.log("HarvestHub initializing - DOM is ready");

    // DOM is guaranteed to be ready at this point
    // Show stored user name immediately if available
    this.updateUserInterface();
    this.setupEventListeners();
    // Apply role-based nav visibility on load
    this.updateNavByRole();

    await this.loadInitialData();
    this.renderCategories();
    this.renderProducers();
    this.renderProducts();
    this.loadCart();
  }

  setupEventListeners() {
    // Initialize authentication system
    this.initAuth();

    // Modal controls
    document
      .getElementById("cartBtn")
      .addEventListener("click", () => this.showModal("cartModal"));
    document
      .getElementById("closeCartModal")
      .addEventListener("click", () => this.hideModal("cartModal"));

    // Forms
    document
      .getElementById("findFoodBtn")
      .addEventListener("click", () => this.handleFindFood());

    // Search functionality
    // Navigation search bar - food search only
    document
      .getElementById("searchInput")
      .addEventListener("input", (e) => this.handleFoodSearch(e.target.value));
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleFoodSearch(e.target.value);
        this.scrollToProducts();
      }
    });

    // Add click event for navigation search button
    const navSearchBtn = document
      .querySelector("#searchInput")
      .parentElement.querySelector("button");
    if (navSearchBtn) {
      navSearchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const searchValue = document.getElementById("searchInput").value;
        this.handleFoodSearch(searchValue);
        this.scrollToProducts();
      });
    }

    // Hero section search - both food and location
    document
      .getElementById("locationInput")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.handleFindFood();
        }
      });

    // Find Food button click event (already exists)
    document
      .getElementById("findFoodBtn")
      .addEventListener("click", () => this.handleFindFood());

    // Checkout button functionality
    document
      .getElementById("checkoutBtn")
      .addEventListener("click", () => this.proceedToCheckout());

    // Close modals on outside click
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("fixed")) {
        e.target.classList.add("hidden");
      }
    });
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.remove("hidden");
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.add("hidden");
  }

  async loadInitialData() {
    try {
      console.log("Loading initial data...");
      // Try to load from API first, but use mock data as fallback
      this.loadMockData(); // Load mock data immediately for testing
      // Ensure each product has a unique, valid image
      this.ensureUniqueProductImages();

      // Uncomment these when database is set up:
      /*
            const categoriesResponse = await fetch('/api/categories');
            if (categoriesResponse.ok) {
                this.categories = await categoriesResponse.json();
            }

            const producersResponse = await fetch('/api/producers/featured');
            if (producersResponse.ok) {
                this.producers = await producersResponse.json();
            }

            const productsResponse = await fetch('/api/products');
            if (productsResponse.ok) {
                this.products = await productsResponse.json();
            }
            */

      console.log("Data loaded successfully:", {
        categories: this.categories.length,
        producers: this.producers.length,
        products: this.products.length,
      });
    } catch (error) {
      console.error("Error loading initial data:", error);
      this.loadMockData();
    }
  }

  loadMockData() {
    // Mock categories - updated to match all the new categories
    this.categories = [
      {
        id: 1,
        name: "Vegetables",
        icon: "🥬",
        description: "Fresh local vegetables",
      },
      { id: 2, name: "Fruits", icon: "🍎", description: "Seasonal fruits" },
      { id: 3, name: "Herbs", icon: "🌿", description: "Fresh herbs & spices" },
      { id: 4, name: "Dairy", icon: "🥛", description: "Fresh dairy products" },
      { id: 5, name: "Eggs", icon: "🥚", description: "Farm fresh eggs" },
      { id: 6, name: "Meat", icon: "🥩", description: "Grass-fed beef & pork" },
      { id: 7, name: "Poultry", icon: "🍗", description: "Free-range chicken" },
      { id: 8, name: "Bread", icon: "🥖", description: "Artisan breads" },
      { id: 9, name: "Pastries", icon: "🥐", description: "Fresh pastries" },
      { id: 10, name: "Cakes", icon: "🎂", description: "Homemade cakes" },
      { id: 11, name: "Cookies", icon: "🍪", description: "Artisan cookies" },
      { id: 12, name: "Grains", icon: "🌾", description: "Whole grains" },
      { id: 13, name: "Legumes", icon: "🫘", description: "Beans & lentils" },
      { id: 14, name: "Nuts", icon: "🥜", description: "Fresh nuts" },
      { id: 15, name: "Seeds", icon: "🌱", description: "Organic seeds" },
      { id: 16, name: "Honey", icon: "🍯", description: "Raw local honey" },
      { id: 17, name: "Maple", icon: "🍁", description: "Pure maple syrup" },
      {
        id: 18,
        name: "Juices",
        icon: "🧃",
        description: "Fresh pressed juices",
      },
      { id: 19, name: "Coffee", icon: "☕", description: "Local roasters" },
      { id: 20, name: "Tea", icon: "🫖", description: "Artisan tea blends" },
      { id: 21, name: "Jams", icon: "🍓", description: "Homemade preserves" },
      { id: 22, name: "Pickles", icon: "🥒", description: "Fermented foods" },
      {
        id: 23,
        name: "Mushrooms",
        icon: "🍄",
        description: "Wild & cultivated",
      },
      { id: 24, name: "Flowers", icon: "🌸", description: "Fresh cut flowers" },
      { id: 25, name: "Sauces", icon: "🥫", description: "Homemade sauces" },
      {
        id: 26,
        name: "Soups",
        icon: "🍲",
        description: "Fresh prepared soups",
      },
      {
        id: 27,
        name: "Salads",
        icon: "🥗",
        description: "Fresh prepared salads",
      },
      { id: 28, name: "Oils", icon: "🫒", description: "Cold-pressed oils" },
      { id: 29, name: "Vinegars", icon: "🍷", description: "Artisan vinegars" },
      {
        id: 30,
        name: "Spices",
        icon: "🧂",
        description: "Fresh ground spices",
      },
    ];

    // Mock producers - Updated for Kenya
    this.producers = [
      {
        id: 1,
        business_name: "Kiambu Green Farm",
        description:
          "Family-owned organic farm specializing in seasonal vegetables",
        rating: 4.8,
        total_reviews: 127,
        address_city: "Kiambu",
        address_county: "Kiambu County",
      },
      {
        id: 2,
        business_name: "Rift Valley Dairy",
        description: "Premium dairy products from grass-fed cows",
        rating: 4.9,
        total_reviews: 89,
        address_city: "Nakuru",
        address_county: "Nakuru County",
      },
      {
        id: 3,
        business_name: "Nairobi Bakery",
        description: "Handcrafted breads and pastries made fresh daily",
        rating: 4.7,
        total_reviews: 156,
        address_city: "Nairobi",
        address_county: "Nairobi County",
      },
      {
        id: 4,
        business_name: "Limuru Fruit Gardens",
        description: "Family orchard growing tropical and temperate fruits",
        rating: 4.5,
        total_reviews: 94,
        address_city: "Limuru",
        address_county: "Kiambu County",
      },
      {
        id: 5,
        business_name: "Kenya Highland Honey",
        description: "Pure honey and bee products from highland apiaries",
        rating: 4.6,
        total_reviews: 73,
        address_city: "Nanyuki",
        address_county: "Laikipia County",
      },
      {
        id: 6,
        business_name: "Kikuyu Poultry Farm",
        description: "Free-range chickens and indigenous breeds",
        rating: 4.4,
        total_reviews: 67,
        address_city: "Kikuyu",
        address_county: "Kiambu County",
      },
    ];

    // Mock products - expanded to include products for all categories
    this.products = [
      // Vegetables (15 products)
      {
        id: 1,
        name: "Organic Tomatoes",
        description: "Fresh, vine-ripened organic tomatoes",
        price: 3.99,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop",
      },
      {
        id: 2,
        name: "Mixed Greens",
        description: "Fresh mixed salad greens",
        price: 2.99,
        unit: "bag",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop",
      },
      {
        id: 3,
        name: "Fresh Carrots",
        description: "Sweet organic carrots",
        price: 1.99,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1447175008436-170170753a5d?w=300&h=300&fit=crop",
      },
      {
        id: 4,
        name: "Bell Peppers",
        description: "Colorful bell peppers - red, yellow, green",
        price: 2.49,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1525607551316-5a9eeaab95ba?w=300&h=300&fit=crop",
      },
      {
        id: 5,
        name: "Cucumbers",
        description: "Crisp, fresh cucumbers",
        price: 1.49,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop",
      },
      {
        id: 6,
        name: "Onions",
        description: "Sweet yellow onions",
        price: 1.29,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop",
      },
      {
        id: 7,
        name: "Potatoes",
        description: "Fresh russet potatoes",
        price: 1.79,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop",
      },
      {
        id: 8,
        name: "Broccoli",
        description: "Fresh green broccoli heads",
        price: 2.99,
        unit: "head",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=300&h=300&fit=crop",
      },
      {
        id: 9,
        name: "Cauliflower",
        description: "White cauliflower heads",
        price: 3.49,
        unit: "head",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&h=300&fit=crop",
      },
      {
        id: 10,
        name: "Spinach",
        description: "Fresh baby spinach leaves",
        price: 3.99,
        unit: "bag",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=300&fit=crop",
      },
      {
        id: 11,
        name: "Kale",
        description: "Organic curly kale",
        price: 2.49,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?w=300&h=300&fit=crop",
      },
      {
        id: 12,
        name: "Zucchini",
        description: "Fresh zucchini squash",
        price: 1.99,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&h=300&fit=crop",
      },
      {
        id: 13,
        name: "Eggplant",
        description: "Purple eggplant",
        price: 2.99,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&h=300&fit=crop",
      },
      {
        id: 14,
        name: "Green Beans",
        description: "Fresh green beans",
        price: 2.79,
        unit: "lb",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&h=300&fit=crop",
      },
      {
        id: 15,
        name: "Sweet Corn",
        description: "Fresh sweet corn on the cob",
        price: 0.99,
        unit: "ear",
        producer_name: "Green Valley Farm",
        category: "Vegetables",
        image:
          "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&h=300&fit=crop",
      },
      // Fruits (15 products)
      {
        id: 16,
        name: "Fresh Apples",
        description: "Crisp, juicy apples from our orchard",
        price: 2.49,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=300&h=300&fit=crop",
      },
      {
        id: 17,
        name: "Strawberries",
        description: "Sweet, ripe strawberries",
        price: 4.99,
        unit: "pint",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop",
      },
      {
        id: 18,
        name: "Blueberries",
        description: "Fresh wild blueberries",
        price: 5.99,
        unit: "pint",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300&h=300&fit=crop",
      },
      {
        id: 19,
        name: "Raspberries",
        description: "Sweet red raspberries",
        price: 6.99,
        unit: "pint",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=300&fit=crop",
      },
      {
        id: 20,
        name: "Peaches",
        description: "Juicy ripe peaches",
        price: 3.99,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 21,
        name: "Plums",
        description: "Sweet purple plums",
        price: 3.49,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 22,
        name: "Cherries",
        description: "Sweet red cherries",
        price: 7.99,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 23,
        name: "Grapes",
        description: "Seedless red grapes",
        price: 4.49,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 24,
        name: "Pears",
        description: "Juicy Bartlett pears",
        price: 2.99,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 25,
        name: "Oranges",
        description: "Sweet navel oranges",
        price: 2.79,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 26,
        name: "Lemons",
        description: "Fresh Meyer lemons",
        price: 3.99,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 27,
        name: "Limes",
        description: "Fresh key limes",
        price: 4.49,
        unit: "lb",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 28,
        name: "Bananas",
        description: "Organic yellow bananas",
        price: 1.99,
        unit: "bunch",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 29,
        name: "Pineapple",
        description: "Fresh whole pineapple",
        price: 4.99,
        unit: "each",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      {
        id: 30,
        name: "Mangoes",
        description: "Sweet ripe mangoes",
        price: 2.99,
        unit: "each",
        producer_name: "Fresh Fields Orchard",
        category: "Fruits",
        image:
          "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&h=300&fit=crop",
      },
      // Herbs (12 products)
      {
        id: 31,
        name: "Fresh Basil",
        description: "Aromatic fresh basil",
        price: 2.99,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&h=300&fit=crop",
      },
      {
        id: 32,
        name: "Fresh Rosemary",
        description: "Aromatic rosemary sprigs",
        price: 3.49,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1504548840739-580b10ae7715?w=300&h=300&fit=crop",
      },
      {
        id: 33,
        name: "Fresh Thyme",
        description: "Fresh thyme leaves",
        price: 2.79,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1505575972945-2804b47a7ea1?w=300&h=300&fit=crop",
      },
      {
        id: 34,
        name: "Fresh Oregano",
        description: "Mediterranean oregano",
        price: 2.99,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1506801310323-534be5e7b3f0?w=300&h=300&fit=crop",
      },
      {
        id: 35,
        name: "Fresh Mint",
        description: "Peppermint leaves",
        price: 2.49,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1524594420848-8365491bcd79?w=300&h=300&fit=crop",
      },
      {
        id: 36,
        name: "Fresh Sage",
        description: "Fresh sage leaves",
        price: 3.99,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1615486363871-2d635a0bae29?w=300&h=300&fit=crop",
      },
      {
        id: 37,
        name: "Fresh Parsley",
        description: "Italian flat-leaf parsley",
        price: 2.29,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1587049352840-02b2b7a98736?w=300&h=300&fit=crop",
      },
      {
        id: 38,
        name: "Fresh Cilantro",
        description: "Fresh cilantro leaves",
        price: 1.99,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1596040033229-7b3f66db8f5a?w=300&h=300&fit=crop",
      },
      {
        id: 39,
        name: "Fresh Dill",
        description: "Fresh dill weed",
        price: 2.79,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1622487506930-f5b2ff6a5d89?w=300&h=300&fit=crop",
      },
      {
        id: 40,
        name: "Fresh Chives",
        description: "Fresh chive sprigs",
        price: 2.49,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1590080875514-8a8f9c7cdbde?w=300&h=300&fit=crop",
      },
      {
        id: 41,
        name: "Fresh Tarragon",
        description: "French tarragon",
        price: 3.99,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1524594081293-190a2fe0baae?w=300&h=300&fit=crop",
      },
      {
        id: 42,
        name: "Fresh Marjoram",
        description: "Sweet marjoram",
        price: 2.99,
        unit: "bunch",
        producer_name: "Green Valley Farm",
        category: "Herbs",
        image:
          "https://images.unsplash.com/photo-1615485737651-9b89e0ee1d3f?w=300&h=300&fit=crop",
      },
      // Dairy (12 products)
      {
        id: 43,
        name: "Fresh Milk",
        description: "Whole milk from grass-fed cows",
        price: 4.5,
        unit: "gallon",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=300&fit=crop",
      },
      {
        id: 44,
        name: "Aged Cheddar",
        description: "Sharp aged cheddar cheese",
        price: 8.99,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 45,
        name: "Fresh Mozzarella",
        description: "Fresh mozzarella cheese",
        price: 6.99,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 46,
        name: "Greek Yogurt",
        description: "Creamy Greek yogurt",
        price: 5.99,
        unit: "quart",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 47,
        name: "Butter",
        description: "Fresh churned butter",
        price: 4.99,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 48,
        name: "Heavy Cream",
        description: "Fresh heavy cream",
        price: 3.99,
        unit: "pint",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 49,
        name: "Cottage Cheese",
        description: "Fresh cottage cheese",
        price: 4.49,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 50,
        name: "Ricotta Cheese",
        description: "Fresh ricotta cheese",
        price: 5.99,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 51,
        name: "Blue Cheese",
        description: "Aged blue cheese",
        price: 12.99,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 52,
        name: "Swiss Cheese",
        description: "Aged Swiss cheese",
        price: 9.99,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 53,
        name: "Provolone",
        description: "Aged provolone cheese",
        price: 8.49,
        unit: "lb",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      {
        id: 54,
        name: "Sour Cream",
        description: "Fresh sour cream",
        price: 2.99,
        unit: "pint",
        producer_name: "Sunny Side Dairy",
        category: "Dairy",
        image:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a9d5?w=300&h=300&fit=crop",
      },
      // Eggs (10 products)
      {
        id: 55,
        name: "Farm Fresh Eggs",
        description: "Free-range chicken eggs",
        price: 5.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 56,
        name: "Large Brown Eggs",
        description: "Large brown eggs",
        price: 6.49,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 57,
        name: "Extra Large Eggs",
        description: "Extra large eggs",
        price: 7.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 58,
        name: "Organic Eggs",
        description: "Organic free-range eggs",
        price: 8.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 59,
        name: "Duck Eggs",
        description: "Fresh duck eggs",
        price: 12.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 60,
        name: "Quail Eggs",
        description: "Fresh quail eggs",
        price: 8.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 61,
        name: "Turkey Eggs",
        description: "Fresh turkey eggs",
        price: 15.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 62,
        name: "Jumbo Eggs",
        description: "Jumbo size eggs",
        price: 9.49,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 63,
        name: "Medium Eggs",
        description: "Medium size eggs",
        price: 4.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
      {
        id: 64,
        name: "Small Eggs",
        description: "Small size eggs",
        price: 3.99,
        unit: "dozen",
        producer_name: "Heritage Poultry Farm",
        category: "Eggs",
        image:
          "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
      },
    ];
  }

  renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    grid.innerHTML = this.categories
      .map(
        (category) => `
            <div class="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
                 onclick="app.filterByCategory('${category.name}')">
                <div class="text-4xl mb-3">${category.icon}</div>
                <h3 class="font-semibold text-gray-900 mb-2">${category.name}</h3>
                <p class="text-sm text-gray-600">${category.description}</p>
            </div>
        `
      )
      .join("");
  }

  renderProducers() {
    const grid = document.getElementById("producersGrid");
    grid.innerHTML = this.producers
      .map(
        (producer) => `
            <div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-store text-2xl text-primary"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 text-lg">${
                      producer.business_name
                    }</h3>
                    <p class="text-gray-600 text-sm">${
                      producer.address_city
                    }, ${producer.address_state}</p>
                </div>
                
                <p class="text-gray-700 text-sm mb-4">${
                  producer.description
                }</p>
                
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="flex text-yellow-400">
                            ${this.generateStars(producer.rating)}
                        </div>
                        <span class="text-sm text-gray-600 ml-2">${
                          producer.rating
                        }</span>
                    </div>
                    <span class="text-sm text-gray-500">${
                      producer.total_reviews
                    } reviews</span>
                </div>
                
                <button onclick="app.viewProducerProducts(${
                  producer.id
                })" class="w-full mt-4 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                    View Products
                </button>
            </div>
        `
      )
      .join("");
  }

  renderProducts() {
    const grid = document.getElementById("productsGrid");
    grid.innerHTML = this.products
      .map(
        (product) => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div class="h-48 bg-gray-200 overflow-hidden">
                    <img src="${product.image}" alt="${
          product.name
        }" data-category="${
          product.category
        }" onerror="handleProductImageError(this, ${
          product.id
        }, '${product.name.replace(/'/g, "\\'")}', '${product.category.replace(
          /'/g,
          "\\'"
        )}')" 
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
                
                <div class="p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-gray-900 text-lg">${
                          product.name
                        }</h3>
                        <span class="text-sm text-gray-500">${
                          product.category
                        }</span>
                    </div>
                    
                    <p class="text-gray-600 text-sm mb-3">${
                      product.description
                    }</p>
                    
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-lg font-bold text-primary">$${product.price.toFixed(
                          2
                        )}</span>
                        <span class="text-sm text-gray-500">per ${
                          product.unit
                        }</span>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4">by ${
                      product.producer_name
                    }</p>
                    
                    <button onclick="app.addToCart(${product.id})" 
                            class="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                        Add to Cart
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = "";

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

  addToCart(productId) {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = this.cart.find((item) => item.id === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        ...product,
        quantity: 1,
      });
    }

    this.updateCart();
    this.showNotification(`${product.name} added to cart!`);
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter((item) => item.id !== productId);
    this.updateCart();
  }

  updateCartQuantity(productId, newQuantity) {
    const item = this.cart.find((item) => item.id === productId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = newQuantity;
      }
    }
    this.updateCart();
  }

  updateCart() {
    // Update cart count
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cartCount").textContent = totalItems;

    // Update cart modal
    this.renderCart();

    // Save to localStorage
    localStorage.setItem("harvestHubCart", JSON.stringify(this.cart));
  }

  renderCart() {
    const cartItems = document.getElementById("cartItems");
    const cartTotal = document.getElementById("cartTotal");

    if (this.cart.length === 0) {
      cartItems.innerHTML =
        '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
      cartTotal.textContent = "$0.00";
      return;
    }

    cartItems.innerHTML = this.cart
      .map(
        (item) => `
            <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <img src="${item.image}" alt="${
          item.name
        }" class="w-16 h-16 object-cover rounded-md">
                
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${item.name}</h4>
                    <p class="text-sm text-gray-600">${item.producer_name}</p>
                    <p class="text-sm text-gray-500">$${item.price.toFixed(
                      2
                    )} per ${item.unit}</p>
                </div>
                
                <div class="flex items-center space-x-2">
                    <button onclick="app.updateCartQuantity(${item.id}, ${
          item.quantity - 1
        })" 
                            class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <span class="w-8 text-center font-semibold">${
                      item.quantity
                    }</span>
                    <button onclick="app.updateCartQuantity(${item.id}, ${
          item.quantity + 1
        })" 
                            class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300">
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
                
                <div class="text-right">
                    <p class="font-semibold text-gray-900">$${(
                      item.price * item.quantity
                    ).toFixed(2)}</p>
                    <button onclick="app.removeFromCart(${item.id})" 
                            class="text-red-500 hover:text-red-700 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    const total = this.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cartTotal.textContent = `$${total.toFixed(2)}`;
  }

  loadCart() {
    const savedCart = localStorage.getItem("harvestHubCart");
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
      this.updateCart();
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        this.currentUser = user;
        if (user && user.role) {
          localStorage.setItem("harvestHubRole", user.role);
        }
        this.hideModal("loginModal");
        this.showNotification("Successfully logged in!");
        this.updateUserInterface();
        // Redirect by role
        if (this.isProducer()) {
          window.location.href = "producers.html";
        } else {
          window.location.href = "/";
        }
      } else {
        this.showNotification(
          "Login failed. Please check your credentials.",
          "error"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification("Login failed. Please try again.", "error");
    }
  }

  updateUserInterface() {
    const loginBtn = document.getElementById("loginBtn");
    if (!loginBtn) return;
    const token = localStorage.getItem("harvestHubToken");
    const storedName = localStorage.getItem("harvestHubDisplayName");
    if (this.currentUser || token || storedName) {
      // Determine display name from various possible fields or stored fallback
      const displayName =
        (this.currentUser &&
          (this.currentUser.first_name ||
            this.currentUser.firstName ||
            this.currentUser.name ||
            this.currentUser.email)) ||
        storedName ||
        "My Account";
      if (displayName) {
        localStorage.setItem("harvestHubDisplayName", displayName);
        loginBtn.textContent = displayName;
      }
    } else {
      // Revert to Sign In text when logged out
      loginBtn.textContent = "Sign In";
      localStorage.removeItem("harvestHubDisplayName");
    }
    // Sync nav based on current role
    this.updateNavByRole();
  }

  // Determine if current user is a producer
  isProducer() {
    const storedRole = localStorage.getItem("harvestHubRole");
    return (
      (this.currentUser && this.currentUser.role === "producer") ||
      storedRole === "producer"
    );
  }

  // Hide/show Producers link based on role
  updateNavByRole() {
    try {
      const producersLink = document.querySelector(
        'a[href="/producers.html"], a[href="producers.html"]'
      );
      if (producersLink) {
        if (this.isProducer()) {
          producersLink.classList.remove("hidden");
          producersLink.style.display = "";
        } else {
          producersLink.classList.add("hidden");
          producersLink.style.display = "none";
        }
      }
    } catch (e) {
      // no-op
    }
  }

  // Authentication system initialization
  initAuth() {
    console.log("🔧 [AUTH] Initializing authentication system...");

    // Get main elements
    let loginBtn = document.getElementById("loginBtn");
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");
    const forgotPasswordModal = document.getElementById("forgotPasswordModal");

    // Explicitly query all elements used below (avoid relying on window globals)
    const closeLoginModal = document.getElementById("closeLoginModal");
    const loginForm = document.getElementById("loginForm");
    const closeRegisterModal = document.getElementById("closeRegisterModal");
    const registerForm = document.getElementById("registerForm");
    const closeForgotPasswordModal = document.getElementById(
      "closeForgotPasswordModal"
    );
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const showRegister = document.getElementById("showRegister");
    const showForgotPassword = document.getElementById("showForgotPassword");
    const showLoginFromRegister = document.getElementById(
      "showLoginFromRegister"
    );
    const showLoginFromForgot = document.getElementById("showLoginFromForgot");
    const backToLogin = document.getElementById("backToLogin");

    // Restore original login button if it was replaced (preserve stored name if available)
    if (document.getElementById("profileContainer")) {
      const storedName = localStorage.getItem("harvestHubDisplayName");
      const label = storedName || "Sign In";
      const loginHtml = `
                <button id="loginBtn" class="text-gray-700 hover:text-green-600 transition-colors">
                    ${label}
                </button>
            `;
      document.getElementById("profileContainer").outerHTML = loginHtml;
    }

    // Re-select after potential replacement above
    loginBtn = document.getElementById("loginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        const hasToken = !!localStorage.getItem("harvestHubToken");
        if (this.currentUser || hasToken) {
          this.promptLogout(e.currentTarget);
        } else if (loginModal) {
          this.showModal("loginModal");
        }
      });
    }

    if (closeLoginModal) {
      closeLoginModal.addEventListener("click", () =>
        this.hideModal("loginModal")
      );
    }

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLoginFormSubmission(e.target);
      });
    }

    // Initialize registration modal
    if (closeRegisterModal) {
      closeRegisterModal.addEventListener("click", () =>
        this.hideModal("registerModal")
      );
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegistration(e.target);
      });
    }

    // Initialize forgot password modal
    if (closeForgotPasswordModal) {
      closeForgotPasswordModal.addEventListener("click", () =>
        this.hideModal("forgotPasswordModal")
      );
    }

    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleForgotPassword(e.target);
      });
    }

    // Navigation between modals
    if (showRegister) {
      console.log("🟢 [AUTH] Adding click listener to showRegister element");
      showRegister.addEventListener("click", (e) => {
        console.log("🎯 [CLICK] Sign up link clicked!");
        e.preventDefault();
        console.log("⬇️ [MODAL] Hiding login modal...");
        this.hideModal("loginModal");
        console.log("⬆️ [MODAL] Showing register modal...");
        this.showModal("registerModal");
        console.log("🔄 [MODAL] Resetting registration modal...");
        this.resetRegistrationModal();
        console.log("✅ [MODAL] Registration modal should now be visible");
        // Ensure the login button keeps the stored display name after modal changes
        this.updateUserInterface();
      });
      console.log(
        "✅ [AUTH] Click listener successfully added to showRegister"
      );
    } else {
      console.error(
        "❌ [AUTH] showRegister element NOT FOUND! Cannot add click listener."
      );
    }

    if (showForgotPassword) {
      showForgotPassword.addEventListener("click", (e) => {
        e.preventDefault();
        this.hideModal("loginModal");
        this.showModal("forgotPasswordModal");
        this.resetForgotPasswordModal();
      });
    }

    if (showLoginFromRegister) {
      showLoginFromRegister.addEventListener("click", (e) => {
        e.preventDefault();
        this.hideModal("registerModal");
        this.showModal("loginModal");
      });
    }

    if (showLoginFromForgot) {
      showLoginFromForgot.addEventListener("click", (e) => {
        e.preventDefault();
        this.hideModal("forgotPasswordModal");
        this.showModal("loginModal");
      });
    }

    if (backToLogin) {
      backToLogin.addEventListener("click", () => {
        this.hideModal("forgotPasswordModal");
        this.showModal("loginModal");
      });
    }

    // Initialize registration flow
    this.initRegistrationFlow();

    // Click outside modal to close
    [loginModal, registerModal, forgotPasswordModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            this.hideModal(modal.id);
          }
        });
      }
    });
  }

  // Show a small popover asking the user to confirm logout
  promptLogout(anchorEl) {
    // Remove any existing popover first
    const existing = document.getElementById("logoutPopover");
    if (existing) existing.remove();

    const rect = anchorEl.getBoundingClientRect();
    const popover = document.createElement("div");
    popover.id = "logoutPopover";
    popover.className =
      "fixed bg-white shadow-lg rounded-md border border-gray-200 z-50";
    popover.style.top = `${rect.bottom + 8 + window.scrollY}px`;
    popover.style.left = `${rect.right - 160 + window.scrollX}px`;
    popover.style.width = "160px";
    popover.innerHTML = `
            <div class="p-3">
                <div class="text-sm text-gray-700 mb-2">You are signed in.</div>
                <button id="confirmLogoutBtn" class="w-full bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm">Log out</button>
                <button id="cancelLogoutBtn" class="w-full mt-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm">Cancel</button>
            </div>
        `;
    document.body.appendChild(popover);

    // Wire events
    const cleanup = () => {
      if (popover && popover.parentNode)
        popover.parentNode.removeChild(popover);
      document.removeEventListener("click", onOutsideClick, true);
    };

    const onOutsideClick = (ev) => {
      if (!popover.contains(ev.target) && ev.target !== anchorEl) {
        cleanup();
      }
    };

    document
      .getElementById("confirmLogoutBtn")
      .addEventListener("click", async () => {
        await this.logout();
        cleanup();
      });
    document
      .getElementById("cancelLogoutBtn")
      .addEventListener("click", cleanup);
    setTimeout(
      () => document.addEventListener("click", onOutsideClick, true),
      0
    );
  }

  // Clear auth state and update UI
  async logout() {
    try {
      localStorage.removeItem("harvestHubToken");
      localStorage.removeItem("harvestHubRole");
      localStorage.removeItem("harvestHubDisplayName");
      this.currentUser = null;
      this.updateUserInterface();
      this.showNotification("You have been logged out.");
      // Redirect to home after logout
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      this.showNotification("Failed to log out. Please try again.", "error");
    }
  }

  // Initialize registration flow with role selection
  initRegistrationFlow() {
    const roleOptions = document.querySelectorAll(".role-option");
    const continueBtn = document.getElementById("continueRegister");
    const backBtn = document.getElementById("backToRoleSelection");
    const roleSelectionStep = document.getElementById("roleSelectionStep");
    const registrationFormStep = document.getElementById(
      "registrationFormStep"
    );

    // Handle role selection
    roleOptions.forEach((option) => {
      option.addEventListener("click", () => {
        // Update radio button
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
        }

        // Enable continue button
        if (continueBtn) {
          continueBtn.disabled = false;
        }

        // Update visual selection
        roleOptions.forEach((opt) =>
          opt.classList.remove("border-primary", "border-secondary")
        );
        const role = option.dataset.role;
        if (role === "customer") {
          option.classList.add("border-primary");
        } else if (role === "producer") {
          option.classList.add("border-secondary");
        }
      });
    });

    // Continue to registration form
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        const selectedRole = document.querySelector(
          'input[name="userRole"]:checked'
        )?.value;
        if (selectedRole) {
          this.showRegistrationForm(selectedRole);
        }
      });
    }

    // Back to role selection
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (roleSelectionStep && registrationFormStep) {
          roleSelectionStep.classList.remove("hidden");
          registrationFormStep.classList.add("hidden");
        }
      });
    }
  }

  // Show registration form based on selected role
  showRegistrationForm(role) {
    const roleSelectionStep = document.getElementById("roleSelectionStep");
    const registrationFormStep = document.getElementById(
      "registrationFormStep"
    );
    const producerFields = document.getElementById("producerFields");
    const roleIcon = document.getElementById("roleIcon");
    const roleTitle = document.getElementById("roleTitle");
    const roleDescription = document.getElementById("roleDescription");
    const businessNameField = document.getElementById("businessName");

    // Hide role selection, show form
    if (roleSelectionStep) roleSelectionStep.classList.add("hidden");
    if (registrationFormStep) registrationFormStep.classList.remove("hidden");

    // Update role display
    if (role === "customer") {
      if (roleIcon)
        roleIcon.className = "fas fa-shopping-cart text-primary mr-3 text-xl";
      if (roleTitle) roleTitle.textContent = "Customer Account";
      if (roleDescription)
        roleDescription.textContent = "Browse and buy fresh local products";
      if (producerFields) producerFields.classList.add("hidden");
      if (businessNameField) businessNameField.required = false;
    } else if (role === "producer") {
      if (roleIcon)
        roleIcon.className = "fas fa-store text-secondary mr-3 text-xl";
      if (roleTitle) roleTitle.textContent = "Producer Account";
      if (roleDescription)
        roleDescription.textContent =
          "Sell your farm products to local customers";
      if (producerFields) producerFields.classList.remove("hidden");
      if (businessNameField) businessNameField.required = true;
    }
  }

  // Handle login form submission with real backend API
  async handleLoginFormSubmission(form) {
    const email = form.querySelector("#loginEmail").value;
    const password = form.querySelector("#loginPassword").value;

    // Basic validation
    if (!email || !password) {
      this.showNotification("Please fill in all fields", "error");
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
    submitBtn.disabled = true;

    try {
      console.log("Login attempt:", { email });

      // Make API call to backend
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // Login successful
        console.log("Login successful:", result);

        // Store token and user data
        if (result.token) {
          localStorage.setItem("harvestHubToken", result.token);
        }

        this.currentUser = result.user;
        if (result.user && result.user.role) {
          localStorage.setItem("harvestHubRole", result.user.role);
        }
        this.updateUserInterface();

        // Close modal
        this.hideModal("loginModal");

        // Show success message
        this.showNotification(`Welcome back, ${result.user.first_name}!`);
        // Redirect by role
        if (this.isProducer()) {
          window.location.href = "producers.html";
        } else {
          window.location.href = "/";
        }
      } else {
        // Login failed
        console.error("Login failed:", result);
        this.showNotification(
          result.message || "Invalid email or password. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification(
        "Network error. Please check your connection and try again.",
        "error"
      );
    } finally {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  // Handle registration form submission
  async handleRegistration(form) {
    const data = {};

    // Collect form data
    const fields = [
      "registerFirstName",
      "registerLastName",
      "registerEmail",
      "registerPhone",
      "registerPassword",
      "registerConfirmPassword",
      "businessName",
      "businessDescription",
    ];

    fields.forEach((field) => {
      const element = form.querySelector(`#${field}`);
      if (element && element.value) {
        data[field] = element.value;
      }
    });

    // Get selected role
    const selectedRole = document.querySelector(
      'input[name="userRole"]:checked'
    )?.value;
    data.role = selectedRole;

    // Validation
    if (
      !data.registerFirstName ||
      !data.registerLastName ||
      !data.registerEmail ||
      !data.registerPhone ||
      !data.registerPassword ||
      !data.registerConfirmPassword
    ) {
      this.showNotification("Please fill in all required fields", "error");
      return;
    }

    if (data.registerPassword !== data.registerConfirmPassword) {
      this.showNotification("Passwords do not match", "error");
      return;
    }

    if (data.registerPassword.length < 6) {
      this.showNotification(
        "Password must be at least 6 characters long",
        "error"
      );
      return;
    }

    if (selectedRole === "producer" && !data.businessName) {
      this.showNotification(
        "Business name is required for producer accounts",
        "error"
      );
      return;
    }

    if (!form.querySelector("#agreeTerms")?.checked) {
      this.showNotification(
        "Please agree to the Terms of Service and Privacy Policy",
        "error"
      );
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector("#registerSubmit");
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';
    submitBtn.disabled = true;

    try {
      // Prepare request data for backend
      const requestData = {
        email: data.registerEmail,
        password: data.registerPassword,
        firstName: data.registerFirstName,
        lastName: data.registerLastName,
        phone: data.registerPhone,
        role: selectedRole,
      };

      console.log("Registration attempt:", {
        ...requestData,
        password: "[HIDDEN]",
      });

      // Make API call to backend
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.ok) {
        // Registration successful
        console.log("Registration successful:", result);

        // Store token if provided
        if (result.token) {
          localStorage.setItem("harvestHubToken", result.token);
          this.currentUser = result.user;
          // Persist role
          if (result.user && result.user.role) {
            localStorage.setItem("harvestHubRole", result.user.role);
          } else if (selectedRole) {
            localStorage.setItem("harvestHubRole", selectedRole);
            this.currentUser = {
              ...(this.currentUser || {}),
              role: selectedRole,
            };
          }
          this.updateUserInterface();
        }

        // If producer, handle business info separately if needed
        if (selectedRole === "producer" && data.businessName) {
          await this.updateProducerProfile({
            businessName: data.businessName,
            description: data.businessDescription || "",
          });
        }

        // Close modal
        this.hideModal("registerModal");

        // Show success message
        this.showNotification(
          `Welcome to HarvestHub! Your ${selectedRole} account has been created successfully.`
        );
        // Redirect by role
        if (selectedRole === "producer" || this.isProducer()) {
          window.location.href = "producers.html";
        } else {
          window.location.href = "/";
        }
      } else {
        // Registration failed
        console.error("Registration failed:", result);
        this.showNotification(
          result.message || "Registration failed. Please try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.showNotification(
        "Network error. Please check your connection and try again.",
        "error"
      );
    } finally {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  // Handle forgot password form submission
  async handleForgotPassword(form) {
    const identifier = form.querySelector("#forgotIdentifier").value;

    if (!identifier) {
      this.showNotification("Please enter your email address", "error");
      return;
    }

    // Show loading state
    const submitBtn = document.getElementById("forgotPasswordSubmitBtn");
    const btnText = document.getElementById("forgotPasswordBtnText");
    const btnLoading = document.getElementById("forgotPasswordBtnLoading");
    const messageEl = document.getElementById("forgotPasswordMessage");

    // Clear previous messages
    messageEl.classList.add("hidden");

    // Set loading state
    submitBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoading.classList.remove("hidden");

    console.log("Password reset request:", { identifier });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        messageEl.innerHTML = `
                    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                        <i class="fas fa-check-circle mr-2"></i>
                        ${result.message}
                    </div>
                `;
        messageEl.classList.remove("hidden");

        // Clear the form
        form.reset();

        // Show success step after a delay
        setTimeout(() => {
          const forgotPasswordStep =
            document.getElementById("forgotPasswordStep");
          const forgotPasswordSuccess = document.getElementById(
            "forgotPasswordSuccess"
          );
          if (forgotPasswordStep) forgotPasswordStep.classList.add("hidden");
          if (forgotPasswordSuccess)
            forgotPasswordSuccess.classList.remove("hidden");
        }, 2000);
      } else if (response.status === 429) {
        // Handle rate limit error
        messageEl.innerHTML = `
                    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        ${
                          result.message ||
                          "Too many attempts. Please try again later."
                        }
                    </div>
                `;
        messageEl.classList.remove("hidden");
      } else {
        // Show error message
        let errorMessage =
          result.message || "Failed to send password reset email";

        messageEl.innerHTML = `
                    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        ${errorMessage}
                    </div>
                `;
        messageEl.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      messageEl.innerHTML = `
                <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Network error. Please check your connection and try again.
                </div>
            `;
      messageEl.classList.remove("hidden");
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      btnText.classList.remove("hidden");
      btnLoading.classList.add("hidden");
    }
  }

  // Reset registration modal to initial state
  resetRegistrationModal() {
    const roleSelectionStep = document.getElementById("roleSelectionStep");
    const registrationFormStep = document.getElementById(
      "registrationFormStep"
    );
    const continueBtn = document.getElementById("continueRegister");
    const roleOptions = document.querySelectorAll(".role-option");

    // Reset to role selection step
    if (roleSelectionStep) roleSelectionStep.classList.remove("hidden");
    if (registrationFormStep) registrationFormStep.classList.add("hidden");

    // Reset selections
    document
      .querySelectorAll('input[name="userRole"]')
      .forEach((radio) => (radio.checked = false));
    roleOptions.forEach((opt) =>
      opt.classList.remove("border-primary", "border-secondary")
    );
    if (continueBtn) continueBtn.disabled = true;

    // Clear form
    const form = document.getElementById("registerForm");
    if (form) form.reset();
  }

  // Reset forgot password modal to initial state
  resetForgotPasswordModal() {
    const forgotPasswordStep = document.getElementById("forgotPasswordStep");
    const forgotPasswordSuccess = document.getElementById(
      "forgotPasswordSuccess"
    );

    if (forgotPasswordStep) forgotPasswordStep.classList.remove("hidden");
    if (forgotPasswordSuccess) forgotPasswordSuccess.classList.add("hidden");

    const form = document.getElementById("forgotPasswordForm");
    if (form) form.reset();
  }

  handleLocationSearch() {
    const locationInput = document.getElementById("locationInput");
    const location = locationInput.value.trim();

    if (!location) {
      this.showNotification("Please enter a location", "error");
      return;
    }

    // Show loading state
    const btn = document.getElementById("findFoodBtn");
    const originalText = btn.textContent;
    btn.textContent = "Searching...";
    btn.disabled = true;

    // Simulate geolocation and search
    setTimeout(() => {
      // Show map section
      this.showMapSection(location);

      // Reset button
      btn.textContent = originalText;
      btn.disabled = false;

      this.showNotification(`Found producers near ${location}!`);
    }, 1500);
  }

  showMapSection(location) {
    // Show map section
    const mapSection = document.getElementById("map-section");
    mapSection.style.display = "block";

    // Smooth scroll to map section
    mapSection.scrollIntoView({ behavior: "smooth" });

    // Update nearby producers with location-based data
    this.loadNearbyProducers(location);
  }

  loadNearbyProducers(location) {
    // Simulate loading nearby producers
    const nearbyContainer = document.getElementById("nearby-producers");

    // Add loading state
    nearbyContainer.innerHTML =
      '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-primary"></i><p class="mt-2 text-gray-600">Finding producers near you...</p></div>';

    // Simulate API call
    setTimeout(() => {
      nearbyContainer.innerHTML = `
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-start space-x-3">
                        <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-store text-primary"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">Green Valley Farm</h4>
                            <p class="text-sm text-gray-600 mb-2">Organic vegetables & herbs</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span><i class="fas fa-map-marker-alt mr-1"></i>2.3 miles from ${location}</span>
                                <span><i class="fas fa-star text-yellow-400 mr-1"></i>4.8</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-start space-x-3">
                        <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-store text-secondary"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">Sunny Side Dairy</h4>
                            <p class="text-sm text-gray-600 mb-2">Fresh milk & cheese</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span><i class="fas fa-map-marker-alt mr-1"></i>3.7 miles from ${location}</span>
                                <span><i class="fas fa-star text-yellow-400 mr-1"></i>4.9</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-start space-x-3">
                        <div class="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-store text-accent"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">Baker's Corner</h4>
                            <p class="text-sm text-gray-600 mb-2">Artisan breads & pastries</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span><i class="fas fa-map-marker-alt mr-1"></i>1.8 miles from ${location}</span>
                                <span><i class="fas fa-star text-yellow-400 mr-1"></i>4.7</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg p-4 shadow-sm">
                    <div class="flex items-start space-x-3">
                        <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-store text-purple-600"></i>
                        </div>
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900">Mountain Honey Co.</h4>
                            <p class="text-sm text-gray-600 mb-2">Raw honey & bee products</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span><i class="fas fa-map-marker-alt mr-1"></i>4.2 miles from ${location}</span>
                                <span><i class="fas fa-star text-yellow-400 mr-1"></i>4.6</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }, 1000);
  }

  // Navigation search bar - food search only
  handleFoodSearch(query) {
    console.log("Food search:", query);

    if (query.length < 2) {
      // If search is cleared, show all products
      this.renderProducts();
      return;
    }

    // Filter products based on search query
    const filteredProducts = this.products.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.producer_name.toLowerCase().includes(query.toLowerCase())
    );

    console.log(
      `Found ${filteredProducts.length} products for query: "${query}"`,
      filteredProducts
    );

    // Render the filtered products
    this.renderFilteredProducts(filteredProducts);

    // Show notification with results count
    if (filteredProducts.length > 0) {
      this.showNotification(
        `Found ${filteredProducts.length} products matching "${query}"`
      );
    } else {
      this.showNotification(`No products found matching "${query}"`, "error");
    }
  }

  // Hero section search - both food and location
  async handleFindFood() {
    const locationInput = document.getElementById("locationInput");
    const searchQuery = locationInput.value.trim();

    if (!searchQuery) {
      this.showNotification("Please enter a search term or location", "error");
      return;
    }

    // Show loading state
    const btn = document.getElementById("findFoodBtn");
    const originalText = btn.textContent;
    btn.textContent = "Searching...";
    btn.disabled = true;

    try {
      // Check if it looks like a location (zip code, city, etc.)
      const locationKeywords = [
        // General location terms
        "zip",
        "code",
        "street",
        "ave",
        "avenue",
        "road",
        "rd",
        "blvd",
        "boulevard",
        "city",
        "state",
        // Kenyan location terms
        "county",
        "town",
        "sub-county",
        "constituency",
        "ward",
        "district",
        // Kenyan county names
        "kiambu",
        "nakuru",
        "nairobi",
        "laikipia",
        "mombasa",
        "kisumu",
        "eldoret",
        "thika",
        "nyeri",
        "meru",
        "embu",
        "machakos",
        "kajiado",
        "murang'a",
        "kirinyaga",
        "nyandarua",
        "trans nzoia",
        "uasin gishu",
        "elgeyo marakwet",
        "nandi",
        "baringo",
        "turkana",
        "west pokot",
        "samburu",
        "marsabit",
        "isiolo",
        "garissa",
        "wajir",
        "mandera",
        "lamu",
        "tana river",
        "kilifi",
        "taita taveta",
        "kwale",
        "makueni",
        "kitui",
        "tharaka nithi",
        "mwingi",
        "bomet",
        "kericho",
        "nyamira",
        "kisii",
        "migori",
        "homa bay",
        "siaya",
        "busia",
        "bungoma",
        "kakamega",
        "vihiga",
        // Common Kenyan city/town names
        "limuru",
        "nanyuki",
        "kikuyu",
        "ruiru",
        "juja",
        "githunguri",
        "lari",
        "gatundu",
        "kiambaa",
        "kabete",
        "karen",
        "langata",
        "westlands",
        "cbd",
        "kasarani",
        "embakasi",
        "dagoretti",
        "mathare",
        "starehe",
        "makadara",
      ];
      const hasNumbers = /\d/.test(searchQuery);
      const isZipCode = /^\d{5}(-\d{4})?$/.test(searchQuery.trim());
      const isStateCode = /\b[A-Z]{2}\b/.test(searchQuery.toUpperCase());
      const hasLocationKeywords = locationKeywords.some((keyword) =>
        searchQuery.toLowerCase().includes(keyword.toLowerCase())
      );

      // Also check if it's a multi-word term (likely a location)
      const isMultiWord = searchQuery.trim().split(" ").length > 1;

      const seemsLikeLocation =
        isZipCode ||
        hasNumbers ||
        isStateCode ||
        hasLocationKeywords ||
        isMultiWord;

      if (seemsLikeLocation) {
        // Handle as location search with real geocoding
        await this.handleLocationSearch(searchQuery);
      } else {
        // Handle as food search
        this.handleFoodSearch(searchQuery);
        this.scrollToProducts();
      }
    } catch (error) {
      console.error("Search error:", error);
      this.showNotification("Search failed. Please try again.", "error");
    } finally {
      // Reset button
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  // Helper method to scroll to products section
  scrollToProducts() {
    const productsSection = document.getElementById("productsGrid");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Legacy method for backward compatibility
  handleSearch(query) {
    return this.handleFoodSearch(query);
  }

  renderFilteredProducts(products) {
    const grid = document.getElementById("productsGrid");
    if (products.length === 0) {
      grid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-gray-500 mb-4">No products found</p>
                    <button onclick="app.showAllProducts()" 
                            class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                        Show All Products
                    </button>
                </div>`;
      return;
    }

    // Render filtered products without overwriting the original products array
    grid.innerHTML = products
      .map(
        (product) => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div class="h-48 bg-gray-200 overflow-hidden">
                    <img src="${product.image}" alt="${
          product.name
        }" data-category="${
          product.category
        }" onerror="handleProductImageError(this, ${
          product.id
        }, '${product.name.replace(/'/g, "\\'")}', '${product.category.replace(
          /'/g,
          "\\'"
        )}')" 
                         class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
                
                <div class="p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-gray-900 text-lg">${
                          product.name
                        }</h3>
                        <span class="text-sm text-gray-500">${
                          product.category
                        }</span>
                    </div>
                    
                    <p class="text-gray-600 text-sm mb-3">${
                      product.description
                    }</p>
                    
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-lg font-bold text-primary">$${product.price.toFixed(
                          2
                        )}</span>
                        <span class="text-sm text-gray-500">per ${
                          product.unit
                        }</span>
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4">by ${
                      product.producer_name
                    }</p>
                    
                    <button onclick="app.addToCart(${product.id})" 
                            class="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors">
                        Add to Cart
                    </button>
                </div>
            </div>
        `
      )
      .join("");
  }

  // Ensure each product has a unique, non-empty image URL
  ensureUniqueProductImages() {
    const seenBaseUrls = new Set();
    this.products = this.products.map((product) => {
      let imageUrl =
        typeof product.image === "string" ? product.image.trim() : "";

      // Helper to create a unique placeholder per product
      const uniquePlaceholder = () => this.generatePlaceholderImage(product);

      if (!imageUrl) {
        imageUrl = uniquePlaceholder();
      } else {
        const base = imageUrl.split("?")[0];
        if (seenBaseUrls.has(base)) {
          // Duplicate image detected → replace with unique placeholder
          imageUrl = uniquePlaceholder();
        } else {
          seenBaseUrls.add(base);
        }
      }

      return { ...product, image: imageUrl };
    });
  }

  // Build a deterministic unique placeholder URL for a product
  generatePlaceholderImage(product) {
    const seed = encodeURIComponent(`harvest-${product.id}-${product.name}`);
    return `https://picsum.photos/seed/${seed}/300/300`;
  }

  showAllProducts() {
    // Clear search inputs
    document.getElementById("searchInput").value = "";

    // Reload the original products data
    this.renderProducts();
    this.showNotification("Showing all products");
  }

  filterByCategory(categoryName) {
    const category = this.categories.find((c) => c.name === categoryName);
    if (!category) return;

    const filteredProducts = this.products.filter(
      (product) => product.category === categoryName
    );

    this.renderFilteredProducts(filteredProducts);
    this.showNotification(`Showing ${categoryName} products`);

    // Scroll to products section
    document
      .getElementById("productsGrid")
      .scrollIntoView({ behavior: "smooth" });
  }

  // Redirect to categories page with producer filter
  viewProducerProducts(producerId) {
    console.log(`Viewing products for producer ID: ${producerId}`);

    // Redirect to categories page with producer query parameter
    window.location.href = `categories.html?producer=${producerId}`;
  }

  // Real location search using free geocoding service
  async handleLocationSearch(location) {
    try {
      console.log("Searching for location:", location);

      // Use free geocoding service (Nominatim from OpenStreetMap) for Kenya
      const encodedLocation = encodeURIComponent(location);
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1&countrycodes=ke`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const displayName = result.display_name;

        console.log("Geocoding result:", { lat, lon, displayName });

        // Show map with real location
        await this.showRealMapSection({
          location: location,
          displayName: displayName,
          lat: lat,
          lon: lon,
        });

        // Filter producers by actual proximity to this location
        this.filterProducersByLocation(lat, lon, location);

        this.showNotification(`Found location: ${displayName}`);
      } else {
        // Fallback to mock data if location not found
        this.showNotification(
          `Could not find "${location}". Showing nearby results.`,
          "error"
        );
        this.showMapSection(location);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      this.showNotification(
        `Could not search location "${location}". Showing nearby results.`,
        "error"
      );
      // Fallback to existing mock data
      this.showMapSection(location);
    }
  }

  async showRealMapSection(locationData) {
    // Show map section
    const mapSection = document.getElementById("map-section");
    if (!mapSection) {
      // Create map section if it doesn't exist
      this.createMapSection();
    }

    mapSection.style.display = "block";

    // Initialize the map with real coordinates
    this.initializeMap(
      locationData.lat,
      locationData.lon,
      locationData.displayName
    );

    // Smooth scroll to map section
    mapSection.scrollIntoView({ behavior: "smooth" });
  }

  createMapSection() {
    // Create the map section HTML if it doesn't exist
    const mapHTML = `
            <section id="map-section" class="py-16 bg-gray-50" style="display: none;">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="text-center mb-8">
                        <h2 class="text-3xl font-bold text-gray-900 mb-4">Local Producers Near You</h2>
                        <p class="text-xl text-gray-600">Fresh food from trusted local vendors in your area</p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <!-- Interactive Map -->
                        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div id="map" class="h-96 bg-gray-200 flex items-center justify-center">
                                <div class="text-center">
                                    <i class="fas fa-map-marker-alt text-4xl text-primary mb-4"></i>
                                    <p class="text-gray-600">Map will load here</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Nearby Producers List -->
                        <div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-4">Nearby Producers</h3>
                            <div id="nearby-producers" class="space-y-4">
                                <!-- Producer cards will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;

    // Insert after the hero section
    const heroSection = document.querySelector("section");
    heroSection.insertAdjacentHTML("afterend", mapHTML);
  }

  initializeMap(lat, lon, locationName) {
    const mapContainer = document.getElementById("map");

    // Simple map placeholder - you can enhance this with Leaflet.js or Google Maps
    mapContainer.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center relative">
                <div class="absolute inset-4 bg-white/20 rounded-lg border-2 border-green-300"></div>
                <div class="text-center z-10">
                    <i class="fas fa-map-marker-alt text-6xl text-red-500 mb-4"></i>
                    <h4 class="text-lg font-semibold text-gray-800">${locationName}</h4>
                    <p class="text-sm text-gray-600">Lat: ${lat.toFixed(
                      4
                    )}, Lon: ${lon.toFixed(4)}</p>
                    <div class="mt-4 text-sm text-gray-500">
                        <p>🌾 Showing local producers within 20 miles</p>
                    </div>
                </div>
            </div>
        `;
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Filter producers based on actual proximity to searched location
  filterProducersByLocation(searchLat, searchLon, locationName) {
    // Add mock coordinates to producers for realistic distance calculation
    const producersWithCoordinates = this.producers.map((producer, index) => {
      // Generate realistic coordinates around Kenya locations
      // In a real app, these would come from your database
      let baseLat, baseLon;

      switch (producer.address_city) {
        case "Kiambu":
          baseLat = -1.1719 + (Math.random() - 0.5) * 0.1; // Kiambu area
          baseLon = 36.8356 + (Math.random() - 0.5) * 0.1;
          break;
        case "Nakuru":
          baseLat = -0.3031 + (Math.random() - 0.5) * 0.1; // Nakuru area
          baseLon = 36.08 + (Math.random() - 0.5) * 0.1;
          break;
        case "Nairobi":
          baseLat = -1.2921 + (Math.random() - 0.5) * 0.1; // Nairobi area
          baseLon = 36.8219 + (Math.random() - 0.5) * 0.1;
          break;
        case "Limuru":
          baseLat = -1.1036 + (Math.random() - 0.5) * 0.1; // Limuru area
          baseLon = 36.642 + (Math.random() - 0.5) * 0.1;
          break;
        case "Nanyuki":
          baseLat = -0.0062 + (Math.random() - 0.5) * 0.1; // Nanyuki area
          baseLon = 37.0735 + (Math.random() - 0.5) * 0.1;
          break;
        case "Kikuyu":
          baseLat = -1.2467 + (Math.random() - 0.5) * 0.1; // Kikuyu area
          baseLon = 36.6635 + (Math.random() - 0.5) * 0.1;
          break;
        default:
          // Default to Nairobi area
          baseLat = -1.2921 + (Math.random() - 0.5) * 0.2;
          baseLon = 36.8219 + (Math.random() - 0.5) * 0.2;
      }

      const distance = this.calculateDistance(
        searchLat,
        searchLon,
        baseLat,
        baseLon
      );

      return {
        ...producer,
        lat: baseLat,
        lon: baseLon,
        distance: distance,
      };
    });

    // Sort by distance and filter to within 25 miles (40 km)
    const nearbyProducers = producersWithCoordinates
      .filter((producer) => producer.distance <= 25)
      .sort((a, b) => a.distance - b.distance);

    this.renderNearbyProducers(nearbyProducers, locationName);
  }

  renderNearbyProducers(producers, locationName) {
    const container = document.getElementById("nearby-producers");

    if (producers.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-search text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 mb-2">No producers found within 25 miles of ${locationName}</p>
                    <p class="text-sm text-gray-500">Try searching a different location or check back soon!</p>
                </div>
            `;
      return;
    }

    container.innerHTML = producers
      .map(
        (producer) => `
            <div class="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div class="flex items-start space-x-3">
                    <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-store text-primary"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${
                          producer.business_name
                        }</h4>
                        <p class="text-sm text-gray-600 mb-2">${
                          producer.description
                        }</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span><i class="fas fa-map-marker-alt mr-1"></i>${producer.distance.toFixed(
                                  1
                                )} miles away</span>
                                <span><i class="fas fa-star text-yellow-400 mr-1"></i>${
                                  producer.rating
                                }</span>
                            </div>
                            <button onclick="app.viewProducerProducts(${
                              producer.id
                            })" class="text-primary hover:text-primary/80 text-sm font-medium">
                                View Products
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  }

  showNotification(message, type = "success") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add("translate-x-full");
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  // Update producer profile with business information
  async updateProducerProfile(profileData) {
    try {
      const token = localStorage.getItem("harvestHubToken");
      if (!token) {
        console.warn("No token available for profile update");
        return;
      }

      // You would implement this API endpoint on the backend
      // For now, we'll just log it since the backend route doesn't exist yet
      console.log("Would update producer profile with:", profileData);

      /*
            const response = await fetch('/api/producers/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            
            if (response.ok) {
                console.log('Producer profile updated successfully');
            } else {
                console.error('Failed to update producer profile');
            }
            */
    } catch (error) {
      console.error("Error updating producer profile:", error);
    }
  }

  proceedToCheckout() {
    // Check if cart is empty
    if (this.cart.length === 0) {
      this.showNotification(
        "Your cart is empty. Add some products first!",
        "error"
      );
      return;
    }

    // Save cart to localStorage to persist during checkout
    localStorage.setItem("harvestHubCart", JSON.stringify(this.cart));

    // Close cart modal
    this.hideModal("cartModal");

    // Show loading notification
    this.showNotification("Redirecting to checkout...");

    // Small delay to show the notification before redirect
    setTimeout(() => {
      // Redirect to checkout page
      window.location.href = "checkout.html";
    }, 500);
  }
}

// Initialize the application when DOM is ready
function initializeApp() {
  console.log("Initializing HarvestHub app...");
  window.app = new HarvestHub();
}

// Debug function to test modal functionality directly
window.testSignUpModal = function () {
  console.log("=== TESTING SIGN UP MODAL ===");

  const showRegister = document.getElementById("showRegister");
  console.log("showRegister element:", showRegister);

  if (showRegister) {
    console.log("Element found! Trying to trigger click...");
    showRegister.click();
    console.log("Click triggered");
  } else {
    console.error("showRegister element NOT FOUND!");

    // Try to find it by class or other means
    const allLinks = document.querySelectorAll("a");
    console.log("All links on page:", allLinks);

    const signUpLinks = Array.from(allLinks).filter((link) =>
      link.textContent.toLowerCase().includes("sign up")
    );
    console.log('Links containing "sign up":', signUpLinks);
  }
};

// Debug function to manually show/hide modals
window.debugModal = function (modalId, action) {
  const modal = document.getElementById(modalId);
  console.log(`Modal ${modalId}:`, modal);

  if (modal) {
    if (action === "show") {
      modal.classList.remove("hidden");
      console.log(`${modalId} shown`);
    } else if (action === "hide") {
      modal.classList.add("hidden");
      console.log(`${modalId} hidden`);
    }
  } else {
    console.error(`Modal ${modalId} not found!`);
  }
};

if (document.readyState === "loading") {
  console.log("DOM still loading, waiting for DOMContentLoaded...");
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  console.log("DOM already ready, initializing app immediately...");
  initializeApp();
}
