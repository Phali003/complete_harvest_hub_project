// API Base URL
const API_BASE_URL = "http://localhost:5000";

class ProducerDashboard {
  constructor() {
    this.currentUser = null;
    this.products = [];
    this.orders = [];
    this.stats = {
      totalProducts: 0,
      pendingProducts: 0,
      totalOrders: 0,
      totalRevenue: 0
    };
    
    this.init();
  }

  checkAuthentication() {
    const token = localStorage.getItem("harvestHubToken");
    const role = localStorage.getItem("harvestHubRole");
    const displayName = localStorage.getItem("harvestHubDisplayName");
    const userId = localStorage.getItem("harvestHubUserId");
    
    if (!token || role !== "producer" || !userId) {
      // Clear any invalid auth data
      localStorage.removeItem("harvestHubToken");
      localStorage.removeItem("harvestHubRole");
      localStorage.removeItem("harvestHubDisplayName");
      localStorage.removeItem("harvestHubUserId");
      
      // Redirect to home if not authenticated as producer
      this.showNotification("Please log in as a producer to access this page", "error");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return false;
    }
    
    // Update producer name in UI
    if (displayName) {
      const producerNameEl = document.getElementById("producerName");
      if (producerNameEl) {
        producerNameEl.textContent = displayName;
      }
    }
    
    return true;
  }

  async init() {
    console.log("Producer Dashboard initializing...");
    
    // Check if user is authenticated and is a producer
    if (!this.checkAuthentication()) {
      return; // Stop initialization if not authenticated
    }
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load dashboard data
    await this.loadDashboardData();
    
    // Show dashboard by default
    this.showTab('dashboard');
  }

  setupEventListeners() {
    // Tab navigation
    const tabs = ['dashboard', 'products', 'orders', 'profile'];
    tabs.forEach(tab => {
      const tabEl = document.getElementById(`${tab}Tab`);
      if (tabEl) {
        tabEl.addEventListener('click', (e) => {
          e.preventDefault();
          this.showTab(tab);
        });
      }
    });

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Add product modal controls
    const addProductBtn = document.getElementById("addProductBtn");
    const closeProductModal = document.getElementById("closeProductModal");
    const cancelProductBtn = document.getElementById("cancelProductBtn");
    const addProductForm = document.getElementById("addProductForm");

    if (addProductBtn) {
      addProductBtn.addEventListener('click', () => {
        this.showModal("addProductModal");
      });
    }

    if (closeProductModal) {
      closeProductModal.addEventListener('click', () => {
        this.hideModal("addProductModal");
      });
    }

    if (cancelProductBtn) {
      cancelProductBtn.addEventListener('click', () => {
        this.hideModal("addProductModal");
      });
    }

    if (addProductForm) {
      addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddProduct(e.target);
      });
    }

    // Image preview for product form
    const productImageInput = document.getElementById("productImage");
    if (productImageInput) {
      productImageInput.addEventListener('change', (e) => {
        this.handleImagePreview(e.target);
      });
    }

    // Profile form
    const profileForm = document.getElementById("profileForm");
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProfileUpdate(e.target);
      });
    }
  }

  showTab(tabName) {
    // Update tab navigation
    const tabs = ['dashboard', 'products', 'orders', 'profile'];
    tabs.forEach(tab => {
      const tabEl = document.getElementById(`${tab}Tab`);
      const contentEl = document.getElementById(`${tab}Content`);
      
      if (tabEl && contentEl) {
        if (tab === tabName) {
          tabEl.classList.add('text-primary', 'border-b-2', 'border-primary', 'pb-1');
          tabEl.classList.remove('text-gray-700', 'hover:text-primary');
          contentEl.classList.remove('hidden');
        } else {
          tabEl.classList.remove('text-primary', 'border-b-2', 'border-primary', 'pb-1');
          tabEl.classList.add('text-gray-700', 'hover:text-primary');
          contentEl.classList.add('hidden');
        }
      }
    });

    // Load data for the selected tab
    if (tabName === 'products') {
      this.loadProducts();
    } else if (tabName === 'orders') {
      this.loadOrders();
    } else if (tabName === 'profile') {
      this.loadProfile();
    }
  }

  async loadDashboardData() {
    try {
      // Load stats and recent activity
      await Promise.all([
        this.loadStats(),
        this.loadRecentActivity()
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.showNotification("Failed to load dashboard data", "error");
    }
  }

  async loadStats() {
    try {
      const token = localStorage.getItem("harvestHubToken");
      
      // For now, using mock data since backend endpoint might not exist yet
      // In production, you would make API calls to get real stats
      this.stats = {
        totalProducts: 12,
        pendingProducts: 3,
        totalOrders: 28,
        totalRevenue: 1847.50
      };
      
      this.updateStatsUI();
      
      /* Uncomment when backend endpoints are ready:
      const response = await fetch(`${API_BASE_URL}/api/producer/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        this.stats = await response.json();
        this.updateStatsUI();
      }
      */
      
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  updateStatsUI() {
    const elements = {
      totalProducts: document.getElementById("totalProducts"),
      pendingProducts: document.getElementById("pendingProducts"),
      totalOrders: document.getElementById("totalOrders"),
      totalRevenue: document.getElementById("totalRevenue")
    };

    if (elements.totalProducts) {
      elements.totalProducts.textContent = this.stats.totalProducts;
    }
    if (elements.pendingProducts) {
      elements.pendingProducts.textContent = this.stats.pendingProducts;
    }
    if (elements.totalOrders) {
      elements.totalOrders.textContent = this.stats.totalOrders;
    }
    if (elements.totalRevenue) {
      elements.totalRevenue.textContent = `$${this.stats.totalRevenue.toFixed(2)}`;
    }
  }

  async loadRecentActivity() {
    const activityEl = document.getElementById("recentActivity");
    if (!activityEl) return;

    // Mock recent activity data
    const activities = [
      {
        type: "order",
        description: "New order received: Order #HH-2024-127",
        time: "2 hours ago",
        icon: "fas fa-shopping-cart",
        color: "text-green-600"
      },
      {
        type: "product",
        description: "Product approved: Organic Tomatoes",
        time: "1 day ago",
        icon: "fas fa-check-circle",
        color: "text-blue-600"
      },
      {
        type: "product",
        description: "New product submitted: Fresh Basil",
        time: "2 days ago",
        icon: "fas fa-plus-circle",
        color: "text-purple-600"
      }
    ];

    activityEl.innerHTML = activities.map(activity => `
      <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
        <div class="p-2 bg-white rounded-lg">
          <i class="${activity.icon} ${activity.color}"></i>
        </div>
        <div class="flex-1">
          <p class="text-sm text-gray-900">${activity.description}</p>
          <p class="text-xs text-gray-500">${activity.time}</p>
        </div>
      </div>
    `).join('');
  }

  async loadProducts() {
    const productsGrid = document.getElementById("productsGrid");
    if (!productsGrid) return;

    try {
      // Show loading state
      productsGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">Loading your products...</p>
        </div>
      `;

      const token = localStorage.getItem("harvestHubToken");
      
      // Mock data for now
      this.products = [
        {
          id: 1,
          name: "Organic Tomatoes",
          category: "Vegetables",
          price: 5.99,
          unit: "per kg",
          status: "approved",
          stock: 50,
          description: "Fresh organic tomatoes grown without pesticides",
          image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop"
        },
        {
          id: 2,
          name: "Fresh Basil",
          category: "Herbs",
          price: 2.99,
          unit: "per bunch",
          status: "pending",
          stock: 25,
          description: "Aromatic fresh basil for cooking",
          image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&h=300&fit=crop"
        },
        {
          id: 3,
          name: "Free-Range Eggs",
          category: "Eggs",
          price: 6.99,
          unit: "per dozen",
          status: "approved",
          stock: 100,
          description: "Fresh eggs from free-range chickens",
          image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop"
        }
      ];

      this.renderProducts();
      
      /* Uncomment when backend endpoint is ready:
      const response = await fetch(`${API_BASE_URL}/api/producer/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        this.products = await response.json();
        this.renderProducts();
      } else {
        throw new Error('Failed to load products');
      }
      */
      
    } catch (error) {
      console.error("Error loading products:", error);
      productsGrid.innerHTML = `
        <div class="col-span-full text-center py-8">
          <i class="fas fa-exclamation-triangle text-2xl text-red-400 mb-4"></i>
          <p class="text-gray-600">Failed to load products</p>
          <button onclick="producerDashboard.loadProducts()" class="mt-2 text-primary hover:underline">Try again</button>
        </div>
      `;
    }
  }

  renderProducts() {
    const productsGrid = document.getElementById("productsGrid");
    if (!productsGrid) return;

    if (this.products.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
          <p class="text-gray-600 mb-4">Start by adding your first product to the marketplace</p>
          <button onclick="producerDashboard.showModal('addProductModal')" 
                  class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <i class="fas fa-plus mr-2"></i>Add Your First Product
          </button>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = this.products.map(product => `
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="h-48 bg-gray-200 overflow-hidden">
          <img src="${product.image}" alt="${product.name}" 
               class="w-full h-full object-cover">
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-gray-900">${product.name}</h3>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${product.status === 'approved' ? 'bg-green-100 text-green-800' : 
                product.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'}">
              ${product.status.charAt(0).toUpperCase() + product.status.slice(1)}
            </span>
          </div>
          <p class="text-sm text-gray-600 mb-2">${product.category}</p>
          <p class="text-sm text-gray-600 mb-3">${product.description}</p>
          <div class="flex items-center justify-between mb-3">
            <span class="text-lg font-bold text-primary">$${product.price}</span>
            <span class="text-sm text-gray-500">${product.unit}</span>
          </div>
          <p class="text-sm text-gray-600 mb-4">Stock: ${product.stock} available</p>
          <div class="flex space-x-2">
            <button onclick="producerDashboard.editProduct(${product.id})" 
                    class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-200 transition-colors">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button onclick="producerDashboard.deleteProduct(${product.id})" 
                    class="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded text-sm hover:bg-red-200 transition-colors">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async loadOrders() {
    const ordersTableBody = document.getElementById("ordersTableBody");
    if (!ordersTableBody) return;

    try {
      // Mock orders data
      this.orders = [
        {
          id: "HH-2024-127",
          customer: "John Doe",
          products: "Organic Tomatoes, Fresh Eggs",
          total: 18.98,
          status: "pending",
          date: "2024-01-15",
          email: "john@example.com"
        },
        {
          id: "HH-2024-126",
          customer: "Sarah Wilson",
          products: "Fresh Basil",
          total: 2.99,
          status: "processing",
          date: "2024-01-14",
          email: "sarah@example.com"
        },
        {
          id: "HH-2024-125",
          customer: "Mike Johnson",
          products: "Organic Tomatoes",
          total: 11.98,
          status: "completed",
          date: "2024-01-13",
          email: "mike@example.com"
        }
      ];

      this.renderOrders();

    } catch (error) {
      console.error("Error loading orders:", error);
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 text-center text-gray-500">
            Failed to load orders
          </td>
        </tr>
      `;
    }
  }

  renderOrders() {
    const ordersTableBody = document.getElementById("ordersTableBody");
    if (!ordersTableBody) return;

    if (this.orders.length === 0) {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 text-center text-gray-500">
            No orders yet
          </td>
        </tr>
      `;
      return;
    }

    ordersTableBody.innerHTML = this.orders.map(order => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${order.id}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${order.customer}
        </td>
        <td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
          ${order.products}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          $${order.total.toFixed(2)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${new Date(order.date).toLocaleDateString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button onclick="producerDashboard.viewOrderDetails('${order.id}')" 
                  class="text-primary hover:text-primary/80">
            View
          </button>
        </td>
      </tr>
    `).join('');
  }

  async loadProfile() {
    // Mock profile data
    const profileData = {
      businessName: localStorage.getItem("harvestHubDisplayName") || "Your Farm Name",
      contactEmail: "producer@example.com",
      businessDescription: "We are a family-owned organic farm committed to providing fresh, high-quality produce to our local community.",
      phoneNumber: "254712345678",
      location: "Kiambu, Kenya"
    };

    // Fill in the profile form
    const fields = {
      businessName: document.getElementById("businessName"),
      contactEmail: document.getElementById("contactEmail"),
      businessDescription: document.getElementById("businessDescription"),
      phoneNumber: document.getElementById("phoneNumber"),
      location: document.getElementById("location")
    };

    Object.keys(fields).forEach(key => {
      if (fields[key] && profileData[key]) {
        fields[key].value = profileData[key];
      }
    });
  }

  async handleAddProduct(form) {
    try {
      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
      submitBtn.disabled = true;
  
      // Get form data
      const formData = new FormData(form);
      const productData = {
        name: formData.get('productName'),
        description: formData.get('productDescription'),
        price: parseFloat(formData.get('productPrice')),
        unit: formData.get('productUnit'),
        stock_quantity: parseInt(formData.get('productStock')) || 0,
        category_id: parseInt(formData.get('productCategory')),
        producer_id: parseInt(localStorage.getItem('harvestHubUserId')), // Make sure this is set during login
        is_available: true
      };
  
      // Get image file
      const imageFile = formData.get('productImage');
      if (imageFile && imageFile.size > 0) {
        // Convert image to base64
        const base64Image = await this.convertImageToBase64(imageFile);
        productData.image = base64Image;
      }
  
      // Send to API
      const token = localStorage.getItem('harvestHubToken');
      const response = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });
  
      if (!response.ok) {
        throw new Error('Failed to add product');
      }
  
      // Reset form and close modal
      form.reset();
      this.hideModal('addProductModal');
      
      // Clear image preview
      const previewEl = document.getElementById('imagePreview');
      if (previewEl) {
        previewEl.innerHTML = '';
      }
  
      // Show success message
      this.showNotification('Product added successfully! It will be reviewed by our team.', 'success');
  
      // Refresh products list
      await this.loadProducts();
  
    } catch (error) {
      console.error('Add product error:', error);
      this.showNotification('Failed to add product. Please try again.', 'error');
    } finally {
      // Reset button state
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  }
  
  // Helper function to convert image to base64
  async convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }
  
  // Add this to your handleImagePreview method
  handleImagePreview(input) {
    const previewEl = document.getElementById('imagePreview');
    if (!previewEl) return;
  
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewEl.innerHTML = `
          <img src="${e.target.result}" alt="Preview" 
               class="max-w-full max-h-48 rounded-lg shadow-sm">
        `;
      };
      reader.readAsDataURL(input.files[0]);
    } else {
      previewEl.innerHTML = '';
    }
  }

  resetImagePreview() {
    const preview = document.getElementById("imagePreview");
    if (preview) {
      preview.classList.add("hidden");
    }
  }

  async handleProfileUpdate(form) {
    const formData = new FormData(form);
    const profileData = {
      businessName: formData.get('businessName') || document.getElementById('businessName').value,
      contactEmail: formData.get('contactEmail') || document.getElementById('contactEmail').value,
      businessDescription: formData.get('businessDescription') || document.getElementById('businessDescription').value,
      phoneNumber: formData.get('phoneNumber') || document.getElementById('phoneNumber').value,
      location: formData.get('location') || document.getElementById('location').value
    };

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    submitBtn.disabled = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local storage
      if (profileData.businessName) {
        localStorage.setItem("harvestHubDisplayName", profileData.businessName);
        const producerNameEl = document.getElementById("producerName");
        if (producerNameEl) {
          producerNameEl.textContent = profileData.businessName;
        }
      }
      
      this.showNotification("Profile updated successfully!", "success");

    } catch (error) {
      console.error("Error updating profile:", error);
      this.showNotification("Failed to update profile. Please try again.", "error");
    } finally {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  editProduct(productId) {
    // Find the product
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    // For now, show a simple alert. In production, you'd open an edit modal
    this.showNotification(`Edit functionality for "${product.name}" coming soon!`, "info");
    
    // TODO: Implement edit product modal and functionality
  }

  async deleteProduct(productId) {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      // Remove from local array (simulate API deletion)
      this.products = this.products.filter(p => p.id !== productId);
      this.stats.totalProducts--;
      this.updateStatsUI();
      this.renderProducts();
      
      this.showNotification("Product deleted successfully", "success");
      
      /* Uncomment when backend endpoint is ready:
      const token = localStorage.getItem("harvestHubToken");
      const response = await fetch(`${API_BASE_URL}/api/producer/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        this.loadProducts(); // Reload products
        this.showNotification("Product deleted successfully", "success");
      } else {
        throw new Error('Failed to delete product');
      }
      */
      
    } catch (error) {
      console.error("Error deleting product:", error);
      this.showNotification("Failed to delete product", "error");
    }
  }

  viewOrderDetails(orderId) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    // For now, show a simple alert with order details
    alert(`Order Details:\n\nOrder ID: ${order.id}\nCustomer: ${order.customer}\nProducts: ${order.products}\nTotal: $${order.total.toFixed(2)}\nStatus: ${order.status}\nDate: ${order.date}`);
    
    // TODO: Implement order details modal
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  logout() {
    // Clear authentication data
    localStorage.removeItem("harvestHubToken");
    localStorage.removeItem("harvestHubRole");
    localStorage.removeItem("harvestHubDisplayName");
    
    // Show notification and redirect
    this.showNotification("Logged out successfully");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }

  showNotification(message, type = "success") {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full max-w-sm ${
      type === "success" ? "bg-green-500 text-white" : 
      type === "error" ? "bg-red-500 text-white" :
      type === "info" ? "bg-blue-500 text-white" : 
      "bg-gray-500 text-white"
    }`;
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button class="ml-2 text-white/80 hover:text-white" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove("translate-x-full");
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add("translate-x-full");
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 300);
      }
    }, 5000);
  }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.producerDashboard = new ProducerDashboard();
});
