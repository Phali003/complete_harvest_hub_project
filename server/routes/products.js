const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Get all products with optional filtering
router.get('/', async (req, res) => {
    try {
        const { category, producer, search, minPrice, maxPrice, sortBy = 'name', order = 'ASC' } = req.query;
        const db = getDb(req);

        let query = `
            SELECT p.*, c.name as category_name, pp.business_name as producer_name, pp.rating as producer_rating
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN producer_profiles pp ON p.producer_id = pp.id
            WHERE p.is_available = TRUE AND p.is_approved = TRUE
        `;
        
        const params = [];

        // Add filters
        if (category) {
            query += ' AND c.id = ?';
            params.push(category);
        }

        if (producer) {
            query += ' AND p.producer_id = ?';
            params.push(producer);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(minPrice);
        }

        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(maxPrice);
        }

        // Add sorting
        const allowedSortFields = ['name', 'price', 'created_at', 'producer_rating'];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        query += ` ORDER BY ${sortField} ${sortOrder}`;

        const [products] = await db.execute(query, params);

        res.json(products);

    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ message: 'Server error getting products' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, pp.business_name as producer_name, 
                   pp.description as producer_description, pp.address_city, pp.address_state,
                   pp.rating as producer_rating, pp.total_reviews
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN producer_profiles pp ON p.producer_id = pp.id
            WHERE p.id = ? AND p.is_available = TRUE AND p.is_approved = TRUE
        `, [id]);

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = products[0];

        // Get product reviews
        const [reviews] = await db.execute(`
            SELECT r.*, u.first_name, u.last_name
            FROM reviews r
            JOIN users u ON r.customer_id = u.id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `, [id]);

        product.reviews = reviews;

        res.json(product);

    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ message: 'Server error getting product' });
    }
});

// Create new product (producer only)
router.post('/', [
    body('name').trim().isLength({ min: 2, max: 255 }),
    body('description').trim().isLength({ min: 10 }),
    body('price').isFloat({ min: 0.01 }),
    body('unit').trim().isLength({ min: 1, max: 50 }),
    body('stock_quantity').isInt({ min: 0 }),
    body('category_id').isInt({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // TODO: Add JWT authentication middleware to verify producer role
        const { name, description, price, unit, stock_quantity, category_id, producer_id } = req.body;
        const db = getDb(req);

        // Verify producer exists
        const [producers] = await db.execute(
            'SELECT id FROM producer_profiles WHERE id = ? AND is_approved = TRUE',
            [producer_id]
        );

        if (producers.length === 0) {
            return res.status(400).json({ message: 'Invalid producer' });
        }

        // Create product
        const [result] = await db.execute(`
            INSERT INTO products (producer_id, category_id, name, description, price, unit, stock_quantity, is_approved)
            VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
        `, [producer_id, category_id, name, description, price, unit, stock_quantity]);

        const productId = result.insertId;

        // Get created product
        const [products] = await db.execute(
            'SELECT * FROM products WHERE id = ?',
            [productId]
        );

        res.status(201).json({
            message: 'Product created successfully',
            product: products[0]
        });

    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server error creating product' });
    }
});

// Update product (producer only)
router.put('/:id', [
    body('name').trim().isLength({ min: 2, max: 255 }),
    body('description').trim().isLength({ min: 10 }),
    body('price').isFloat({ min: 0.01 }),
    body('unit').trim().isLength({ min: 1, max: 50 }),
    body('stock_quantity').isInt({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { name, description, price, unit, stock_quantity, is_available } = req.body;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify producer owns this product

        // Update product
        await db.execute(`
            UPDATE products 
            SET name = ?, description = ?, price = ?, unit = ?, stock_quantity = ?, is_available = ?
            WHERE id = ?
        `, [name, description, price, unit, stock_quantity, is_available, id]);

        // Get updated product
        const [products] = await db.execute(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({
            message: 'Product updated successfully',
            product: products[0]
        });

    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Server error updating product' });
    }
});

// Delete product (producer only)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify producer owns this product

        // Check if product exists
        const [products] = await db.execute(
            'SELECT id FROM products WHERE id = ?',
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Soft delete - mark as unavailable
        await db.execute(
            'UPDATE products SET is_available = FALSE WHERE id = ?',
            [id]
        );

        res.json({ message: 'Product deleted successfully' });

    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server error deleting product' });
    }
});

// Get products by producer
router.get('/producer/:producerId', async (req, res) => {
    try {
        const { producerId } = req.params;
        const db = getDb(req);

        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.producer_id = ? AND p.is_available = TRUE
            ORDER BY p.created_at DESC
        `, [producerId]);

        res.json(products);

    } catch (error) {
        console.error('Get producer products error:', error);
        res.status(500).json({ message: 'Server error getting producer products' });
    }
});

// Search products
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const db = getDb(req);

        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name, pp.business_name as producer_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN producer_profiles pp ON p.producer_id = pp.id
            WHERE p.is_available = TRUE AND p.is_approved = TRUE
            AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR pp.business_name LIKE ?)
            ORDER BY p.name ASC
        `, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]);

        res.json(products);

    } catch (error) {
        console.error('Search products error:', error);
        res.status(500).json({ message: 'Server error searching products' });
    }
});

module.exports = router; 