const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// TODO: Add admin authentication middleware

// Get platform overview statistics
router.get('/overview', async (req, res) => {
    try {
        const db = getDb(req);

        // Get total counts
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [producerCount] = await db.execute('SELECT COUNT(*) as total FROM producer_profiles WHERE is_approved = TRUE');
        const [productCount] = await db.execute('SELECT COUNT(*) as total FROM products WHERE is_available = TRUE AND is_approved = TRUE');
        const [orderCount] = await db.execute('SELECT COUNT(*) as total FROM orders');
        const [paymentCount] = await db.execute('SELECT COUNT(*) as total FROM payments WHERE status = "completed"');

        // Get revenue statistics
        const [revenueStats] = await db.execute(`
            SELECT 
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value,
                COUNT(*) as total_orders
            FROM orders 
            WHERE status = 'completed'
        `);

        // Get recent activity
        const [recentOrders] = await db.execute(`
            SELECT o.*, u.first_name, u.last_name, pp.business_name
            FROM orders o
            JOIN users u ON o.customer_id = u.id
            JOIN producer_profiles pp ON o.producer_id = pp.id
            ORDER BY o.created_at DESC
            LIMIT 10
        `);

        const [recentUsers] = await db.execute(`
            SELECT id, first_name, last_name, email, role, created_at
            FROM users
            ORDER BY created_at DESC
            LIMIT 10
        `);

        const overview = {
            counts: {
                users: userCount[0].total,
                producers: producerCount[0].total,
                products: productCount[0].total,
                orders: orderCount[0].total,
                payments: paymentCount[0].total
            },
            revenue: revenueStats[0],
            recentActivity: {
                orders: recentOrders,
                users: recentUsers
            }
        };

        res.json(overview);

    } catch (error) {
        console.error('Get admin overview error:', error);
        res.status(500).json({ message: 'Server error getting admin overview' });
    }
});

// Get pending producer approvals
router.get('/producers/pending', async (req, res) => {
    try {
        const db = getDb(req);

        const [pendingProducers] = await db.execute(`
            SELECT pp.*, u.first_name, u.last_name, u.email, u.phone, u.created_at
            FROM producer_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.is_approved = FALSE
            ORDER BY u.created_at ASC
        `);

        res.json(pendingProducers);

    } catch (error) {
        console.error('Get pending producers error:', error);
        res.status(500).json({ message: 'Server error getting pending producers' });
    }
});

// Approve/reject producer
router.patch('/producers/:id/approval', [
    body('is_approved').isBoolean(),
    body('reason').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { is_approved, reason } = req.body;
        const db = getDb(req);

        // Update producer approval status
        await db.execute(`
            UPDATE producer_profiles SET is_approved = ? WHERE id = ?
        `, [is_approved, id]);

        // If approved, also approve their products
        if (is_approved) {
            await db.execute(`
                UPDATE products SET is_approved = TRUE WHERE producer_id = ?
            `, [id]);
        }

        res.json({
            message: `Producer ${is_approved ? 'approved' : 'rejected'} successfully`,
            is_approved
        });

    } catch (error) {
        console.error('Update producer approval error:', error);
        res.status(500).json({ message: 'Server error updating producer approval' });
    }
});

// Get pending product approvals
router.get('/products/pending', async (req, res) => {
    try {
        const db = getDb(req);

        const [pendingProducts] = await db.execute(`
            SELECT p.*, c.name as category_name, pp.business_name as producer_name,
                   u.first_name, u.last_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            JOIN producer_profiles pp ON p.producer_id = pp.id
            JOIN users u ON pp.user_id = u.id
            WHERE p.is_approved = FALSE
            ORDER BY p.created_at ASC
        `);

        res.json(pendingProducts);

    } catch (error) {
        console.error('Get pending products error:', error);
        res.status(500).json({ message: 'Server error getting pending products' });
    }
});

// Approve/reject product
router.patch('/products/:id/approval', [
    body('is_approved').isBoolean(),
    body('reason').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { is_approved, reason } = req.body;
        const db = getDb(req);

        // Update product approval status
        await db.execute(`
            UPDATE products SET is_approved = ? WHERE id = ?
        `, [is_approved, id]);

        res.json({
            message: `Product ${is_approved ? 'approved' : 'rejected'} successfully`,
            is_approved
        });

    } catch (error) {
        console.error('Update product approval error:', error);
        res.status(500).json({ message: 'Server error updating product approval' });
    }
});

// Get user management list
router.get('/users', async (req, res) => {
    try {
        const { role, status, page = 1, limit = 20 } = req.query;
        const db = getDb(req);

        const offset = (page - 1) * limit;
        let query = `
            SELECT u.*, pp.business_name, pp.is_approved as producer_approved
            FROM users u
            LEFT JOIN producer_profiles pp ON u.id = pp.user_id
        `;
        
        const params = [];
        const whereConditions = [];

        if (role) {
            whereConditions.push('u.role = ?');
            params.push(role);
        }

        if (status === 'verified') {
            whereConditions.push('u.is_verified = TRUE');
        } else if (status === 'unverified') {
            whereConditions.push('u.is_verified = FALSE');
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [users] = await db.execute(query, params);

        res.json(users);

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error getting users' });
    }
});

// Update user status
router.patch('/users/:id/status', [
    body('is_verified').isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { is_verified } = req.body;
        const db = getDb(req);

        // Update user verification status
        await db.execute(`
            UPDATE users SET is_verified = ? WHERE id = ?
        `, [is_verified, id]);

        res.json({
            message: `User ${is_verified ? 'verified' : 'unverified'} successfully`,
            is_verified
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ message: 'Server error updating user status' });
    }
});

// Get platform analytics
router.get('/analytics', async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const db = getDb(req);

        // Get date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Get order trends
        const [orderTrends] = await db.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                SUM(total_amount) as daily_revenue
            FROM orders 
            WHERE created_at >= ? AND created_at <= ?
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [startDate, endDate]);

        // Get top products
        const [topProducts] = await db.execute(`
            SELECT 
                p.name, p.id, c.name as category,
                COUNT(oi.id) as order_count,
                SUM(oi.quantity) as total_quantity
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE o.created_at >= ? AND o.created_at <= ?
            GROUP BY p.id
            ORDER BY order_count DESC
            LIMIT 10
        `, [startDate, endDate]);

        // Get top producers
        const [topProducers] = await db.execute(`
            SELECT 
                pp.business_name, pp.id,
                COUNT(o.id) as order_count,
                SUM(o.total_amount) as total_revenue
            FROM producer_profiles pp
            LEFT JOIN orders o ON pp.id = o.producer_id
            WHERE o.created_at >= ? AND o.created_at <= ?
            GROUP BY pp.id
            ORDER BY total_revenue DESC
            LIMIT 10
        `, [startDate, endDate]);

        const analytics = {
            period,
            orderTrends,
            topProducts,
            topProducers
        };

        res.json(analytics);

    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ message: 'Server error getting analytics' });
    }
});

// Get system health
router.get('/health', async (req, res) => {
    try {
        const db = getDb(req);

        // Test database connection
        const [dbHealth] = await db.execute('SELECT 1 as status');
        
        // Get system metrics
        const [userCount] = await db.execute('SELECT COUNT(*) as total FROM users');
        const [orderCount] = await db.execute('SELECT COUNT(*) as total FROM orders');
        const [productCount] = await db.execute('SELECT COUNT(*) as total FROM products');

        const health = {
            status: 'healthy',
            database: dbHealth.length > 0 ? 'connected' : 'disconnected',
            metrics: {
                users: userCount[0].total,
                orders: orderCount[0].total,
                products: productCount[0].total
            },
            timestamp: new Date().toISOString()
        };

        res.json(health);

    } catch (error) {
        console.error('Get system health error:', error);
        res.status(500).json({ 
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 