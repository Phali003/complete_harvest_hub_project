const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Get all orders for a user (customer or producer)
router.get('/', async (req, res) => {
    try {
        const { userId, role, status, page = 1, limit = 20 } = req.query;
        const db = getDb(req);

        if (!userId || !role) {
            return res.status(400).json({ message: 'User ID and role are required' });
        }

        let query = '';
        const params = [];
        const offset = (page - 1) * limit;

        if (role === 'customer') {
            // Get orders for customer
            query = `
                SELECT o.*, pp.business_name as producer_name, pp.address_city, pp.address_state,
                       COUNT(oi.id) as item_count
                FROM orders o
                JOIN producer_profiles pp ON o.producer_id = pp.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.customer_id = ?
            `;
            params.push(userId);
        } else if (role === 'producer') {
            // Get orders for producer
            query = `
                SELECT o.*, u.first_name, u.last_name, u.email, u.phone,
                       COUNT(oi.id) as item_count
                FROM orders o
                JOIN users u ON o.customer_id = u.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                WHERE o.producer_id = ?
            `;
            params.push(userId);
        }

        // Add status filter
        if (status) {
            query += ' AND o.status = ?';
            params.push(status);
        }

        query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [orders] = await db.execute(query, params);

        // Get order items for each order
        for (let order of orders) {
            const [orderItems] = await db.execute(`
                SELECT oi.*, p.name as product_name, p.unit, p.images
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
            `, [order.id]);
            
            order.items = orderItems;
        }

        res.json(orders);

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error getting orders' });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const [orders] = await db.execute(`
            SELECT o.*, pp.business_name as producer_name, pp.address_city, pp.address_state,
                   u.first_name, u.last_name, u.email, u.phone
            FROM orders o
            JOIN producer_profiles pp ON o.producer_id = pp.id
            JOIN users u ON o.customer_id = u.id
            WHERE o.id = ?
        `, [id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];

        // Get order items
        const [orderItems] = await db.execute(`
            SELECT oi.*, p.name as product_name, p.unit, p.images, p.description
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        order.items = orderItems;

        res.json(order);

    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server error getting order' });
    }
});

// Create new order
router.post('/', [
    body('customer_id').isInt({ min: 1 }),
    body('producer_id').isInt({ min: 1 }),
    body('items').isArray({ min: 1 }),
    body('items.*.product_id').isInt({ min: 1 }),
    body('items.*.quantity').isInt({ min: 1 }),
    body('delivery_type').isIn(['pickup', 'delivery']),
    body('delivery_address').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { customer_id, producer_id, items, delivery_type, delivery_address, notes } = req.body;
        const db = getDb(req);

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            let totalAmount = 0;
            const orderItems = [];

            // Validate products and calculate total
            for (const item of items) {
                const [products] = await connection.execute(`
                    SELECT p.*, pp.business_name
                    FROM products p
                    JOIN producer_profiles pp ON p.producer_id = pp.id
                    WHERE p.id = ? AND p.producer_id = ? AND p.is_available = TRUE
                `, [item.product_id, producer_id]);

                if (products.length === 0) {
                    throw new Error(`Product ${item.product_id} not found or unavailable`);
                }

                const product = products[0];
                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}`);
                }

                const itemTotal = product.price * item.quantity;
                totalAmount += itemTotal;

                orderItems.push({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: product.price,
                    total_price: itemTotal
                });

                // Update stock
                await connection.execute(
                    'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                    [item.quantity, item.product_id]
                );
            }

            // Create order
            const [orderResult] = await connection.execute(`
                INSERT INTO orders (customer_id, producer_id, total_amount, delivery_type, delivery_address, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [customer_id, producer_id, totalAmount, delivery_type, delivery_address, notes]);

            const orderId = orderResult.insertId;

            // Create order items
            for (const item of orderItems) {
                await connection.execute(`
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?)
                `, [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]);
            }

            await connection.commit();

            // Get created order
            const [orders] = await db.execute(`
                SELECT o.*, pp.business_name as producer_name
                FROM orders o
                JOIN producer_profiles pp ON o.producer_id = pp.id
                WHERE o.id = ?
            `, [orderId]);

            res.status(201).json({
                message: 'Order created successfully',
                order: orders[0]
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: error.message || 'Server error creating order' });
    }
});

// Update order status (producer only)
router.patch('/:id/status', [
    body('status').isIn(['confirmed', 'preparing', 'ready', 'completed', 'cancelled'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status, notes } = req.body;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify producer owns this order

        // Update order status
        await db.execute(`
            UPDATE orders SET status = ?, notes = CONCAT(IFNULL(notes, ''), '\n', ?)
            WHERE id = ?
        `, [status, `Status updated to ${status} at ${new Date().toISOString()}`, id]);

        // Get updated order
        const [orders] = await db.execute(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json({
            message: 'Order status updated successfully',
            order: orders[0]
        });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error updating order status' });
    }
});

// Cancel order (customer only)
router.patch('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_id } = req.body;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify customer owns this order

        // Check if order can be cancelled
        const [orders] = await db.execute(`
            SELECT status FROM orders WHERE id = ? AND customer_id = ?
        `, [id, customer_id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (orders[0].status !== 'pending') {
            return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
        }

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update order status
            await connection.execute(
                'UPDATE orders SET status = "cancelled" WHERE id = ?',
                [id]
            );

            // Restore product stock
            const [orderItems] = await connection.execute(`
                SELECT product_id, quantity FROM order_items WHERE order_id = ?
            `, [id]);

            for (const item of orderItems) {
                await connection.execute(`
                    UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?
                `, [item.quantity, item.product_id]);
            }

            await connection.commit();

            res.json({ message: 'Order cancelled successfully' });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ message: 'Server error cancelling order' });
    }
});

// Get order statistics
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.query;
        const db = getDb(req);

        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }

        let stats = {};

        if (role === 'customer') {
            // Customer order stats
            const [customerStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
                    SUM(total_amount) as total_spent,
                    AVG(total_amount) as avg_order_value
                FROM orders 
                WHERE customer_id = ?
            `, [userId]);

            stats = customerStats[0];
        } else if (role === 'producer') {
            // Producer order stats
            const [producerStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total_orders,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
                    COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders,
                    COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready_orders,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_order_value
                FROM orders 
                WHERE producer_id = ?
            `, [userId]);

            stats = producerStats[0];
        }

        res.json(stats);

    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ message: 'Server error getting order statistics' });
    }
});

module.exports = router; 