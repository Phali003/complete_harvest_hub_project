const express = require('express');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Get all categories
router.get('/', async (req, res) => {
    try {
        const db = getDb(req);
        
        const [categories] = await db.execute(`
            SELECT c.*, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_available = TRUE AND p.is_approved = TRUE
            GROUP BY c.id
            ORDER BY c.name ASC
        `);

        res.json(categories);

    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server error getting categories' });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const [categories] = await db.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const category = categories[0];

        // Get products in this category
        const [products] = await db.execute(`
            SELECT p.*, pp.business_name as producer_name
            FROM products p
            LEFT JOIN producer_profiles pp ON p.producer_id = pp.id
            WHERE p.category_id = ? AND p.is_available = TRUE AND p.is_approved = TRUE
            ORDER BY p.name ASC
        `, [id]);

        category.products = products;

        res.json(category);

    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ message: 'Server error getting category' });
    }
});

// Get products by category with pagination
router.get('/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20, sortBy = 'name', order = 'ASC' } = req.query;
        const db = getDb(req);

        const offset = (page - 1) * limit;

        // Get products count
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM products p
            WHERE p.category_id = ? AND p.is_available = TRUE AND p.is_approved = TRUE
        `, [id]);

        const totalProducts = countResult[0].total;
        const totalPages = Math.ceil(totalProducts / limit);

        // Get products
        const [products] = await db.execute(`
            SELECT p.*, pp.business_name as producer_name, pp.rating as producer_rating
            FROM products p
            LEFT JOIN producer_profiles pp ON p.producer_id = pp.id
            WHERE p.category_id = ? AND p.is_available = TRUE AND p.is_approved = TRUE
            ORDER BY p.${sortBy} ${order}
            LIMIT ? OFFSET ?
        `, [id, parseInt(limit), offset]);

        res.json({
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get category products error:', error);
        res.status(500).json({ message: 'Server error getting category products' });
    }
});

module.exports = router; 