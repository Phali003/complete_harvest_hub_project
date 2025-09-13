# 🌾 Harvest Hub - Digital Farmers' Market Platform

A comprehensive digital marketplace platform that connects local food producers (farmers, bakers, artisans) with customers in a specific geographic area. Built with modern web technologies to create a sustainable, community-driven food ecosystem.

## 🚀 Features

### Customer Interface

- **Landing Page**: Beautiful hero section with location-based search
- **Geospatial Search**: Find producers and products near you
- **Product Catalog**: Browse fresh local products by category
- **Producer Profiles**: Learn about local farmers and their stories
- **Shopping Cart**: Seamless e-commerce experience
- **Order Management**: Track orders from placement to delivery
- **Reviews & Ratings**: Rate products and producers

### Producer Dashboard

- **Vendor Registration**: Simple signup process for local producers
- **Product Management**: Add, edit, and manage product listings
- **Order Management**: Handle incoming orders and update statuses
- **Sales Analytics**: Track performance and revenue
- **Business Profile**: Manage store hours and delivery options

### Admin Panel

- **User Management**: Approve producers and manage customer accounts
- **Content Moderation**: Review and approve products/profiles
- **Transaction Management**: Monitor payments and handle disputes
- **Platform Analytics**: Comprehensive reporting and insights
- **System Health**: Monitor platform performance

## 🛠️ Technology Stack

### Frontend

- **HTML5**: Semantic markup for accessibility
- **Tailwind CSS**: Utility-first CSS framework for modern design
- **JavaScript (ES6+)**: Vanilla JS with modern features
- **Responsive Design**: Mobile-first approach

### Backend

- **Node.js**: Server-side JavaScript runtime
- **Express.js**: Fast, unopinionated web framework
- **MySQL**: Robust relational database
- **JWT**: Secure authentication and authorization

### Additional Technologies

- **Stripe**: Payment processing
- **Nodemailer**: Email notifications
- **Geolib**: Location-based calculations
- **Multer**: File upload handling

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd harvest-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE harvest_hub;
USE harvest_hub;

# Run the schema file
mysql -u root -p harvest_hub < database/schema.sql
```

### 4. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at:

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## 🔧 Configuration

### Environment Variables

| Variable            | Description        | Default     |
| ------------------- | ------------------ | ----------- |
| `PORT`              | Server port        | 5000        |
| `DB_HOST`           | MySQL host         | localhost   |
| `DB_USER`           | MySQL username     | root        |
| `DB_PASSWORD`       | MySQL password     | -           |
| `DB_NAME`           | Database name      | harvest_hub |
| `JWT_SECRET`        | JWT signing secret | -           |
| `STRIPE_SECRET_KEY` | Stripe secret key  | -           |
| `SMTP_HOST`         | Email server host  | -           |

### Database Configuration

The platform uses MySQL with the following main tables:

- `users` - Customer and producer accounts
- `producer_profiles` - Business information for vendors
- `products` - Product listings with inventory
- `orders` - Customer orders and status tracking
- `payments` - Payment processing and transactions
- `categories` - Product categorization
- `reviews` - Customer feedback and ratings

## 📱 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Products

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product (producer only)
- `PUT /api/products/:id` - Update product (producer only)

### Producers

- `GET /api/producers` - List all producers
- `GET /api/producers/featured` - Get featured producers
- `GET /api/producers/:id` - Get producer details
- `POST /api/producers` - Create producer profile

### Orders

- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

### Admin

- `GET /api/admin/overview` - Platform statistics
- `GET /api/admin/producers/pending` - Pending approvals
- `PATCH /api/admin/producers/:id/approval` - Approve/reject producer

## 🎨 Customization

### Styling

The platform uses Tailwind CSS for styling. Customize the design by:

1. Modifying the Tailwind config in `public/index.html`
2. Adding custom CSS classes
3. Updating color schemes and typography

### Features

- Add new product categories
- Implement additional payment methods
- Extend user roles and permissions
- Add notification systems
- Integrate with external services

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt encryption for user passwords
- **Input Validation**: Express-validator for request sanitization
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express.js
- **Rate Limiting**: Protection against abuse

## 📊 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient MySQL connection management
- **Compression**: Gzip compression for responses
- **Static File Serving**: Optimized static asset delivery
- **Caching**: Local storage for cart and user preferences

## 🧪 Testing

The platform includes comprehensive error handling and validation:

- Input validation on all API endpoints
- Database transaction management
- Error logging and monitoring
- Graceful fallbacks for failed operations

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Set production values
2. **Database**: Use production MySQL instance
3. **SSL**: Enable HTTPS with proper certificates
4. **Monitoring**: Implement logging and health checks
5. **Backup**: Regular database backups
6. **Scaling**: Consider load balancing for high traffic

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔮 Future Enhancements

- **Mobile App**: React Native or Flutter mobile application
- **Real-time Chat**: Customer-producer communication
- **Advanced Analytics**: Machine learning insights
- **Delivery Integration**: Third-party delivery services
- **Multi-language Support**: Internationalization
- **Subscription Models**: CSA and membership programs

---

**Harvest Hub** - Connecting communities through fresh, local food. 🌱
