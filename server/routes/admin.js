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

        // Get producer info for activity feed
        const [producerInfo] = await db.execute(`
            SELECT pp.business_name, u.first_name, u.last_name
            FROM producer_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.id = ?
        `, [id]);

        // Update producer approval status
        await db.execute(`
            UPDATE producer_profiles SET is_approved = ?, updated_at = NOW() WHERE id = ?
        `, [is_approved, id]);

        // If approved, also approve their products
        if (is_approved) {
            await db.execute(`
                UPDATE products SET is_approved = TRUE WHERE producer_id = ?
            `, [id]);
        }

        // Broadcast real-time activity update
        if (req.app.locals.io && is_approved && producerInfo.length > 0) {
            const activity = {
                type: 'producer_approval',
                description: `Producer approved: ${producerInfo[0].business_name}`,
                created_at: new Date().toISOString(),
                reference_id: id
            };
            req.app.locals.io.to('admin').emit('activityUpdate', activity);
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

        // Get product info for activity feed
        const [productInfo] = await db.execute(`
            SELECT p.name, pp.business_name
            FROM products p
            JOIN producer_profiles pp ON p.producer_id = pp.id
            WHERE p.id = ?
        `, [id]);

        // Update product approval status
        await db.execute(`
            UPDATE products SET is_approved = ?, updated_at = NOW() WHERE id = ?
        `, [is_approved, id]);

        // Broadcast real-time activity update
        if (req.app.locals.io && is_approved && productInfo.length > 0) {
            const activity = {
                type: 'product_approval',
                description: `Product approved: ${productInfo[0].name}`,
                created_at: new Date().toISOString(),
                reference_id: id
            };
            req.app.locals.io.to('admin').emit('activityUpdate', activity);
        }

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

// Get detailed order management data
router.get('/orders', async (req, res) => {
    try {
        const { status, page = 1, limit = 20, search } = req.query;
        const db = getDb(req);
        const offset = (page - 1) * limit;

        let query = `
            SELECT o.*, u.first_name, u.last_name, u.email, 
                   pp.business_name as producer_name,
                   COUNT(oi.id) as item_count,
                   GROUP_CONCAT(p.name SEPARATOR ', ') as product_names
            FROM orders o
            JOIN users u ON o.customer_id = u.id
            JOIN producer_profiles pp ON o.producer_id = pp.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
        `;
        
        const params = [];
        const whereConditions = [];

        if (status) {
            whereConditions.push('o.status = ?');
            params.push(status);
        }

        if (search) {
            whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR pp.business_name LIKE ?)');
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        if (whereConditions.length > 0) {
            query += ' WHERE ' + whereConditions.join(' AND ');
        }

        query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), offset);

        const [orders] = await db.execute(query, params);
        res.json(orders);

    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server error getting orders' });
    }
});

// Update order status
router.patch('/orders/:id/status', [
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status } = req.body;
        const db = getDb(req);

        await db.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

        res.json({ message: 'Order status updated successfully', status });

    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server error updating order status' });
    }
});

// Get payment statistics
router.get('/payments/stats', async (req, res) => {
    try {
        const db = getDb(req);
        
        const [paymentStats] = await db.execute(`
            SELECT 
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
                SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as failed_amount,
                AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment
            FROM payments
        `);

        const [recentPayments] = await db.execute(`
            SELECT p.*, o.id as order_id, u.first_name, u.last_name
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            JOIN users u ON o.customer_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        res.json({
            stats: paymentStats[0],
            recent: recentPayments
        });

    } catch (error) {
        console.error('Get payment stats error:', error);
        res.status(500).json({ message: 'Server error getting payment stats' });
    }
});

// Get platform settings
router.get('/settings', async (req, res) => {
    try {
        const db = getDb(req);
        
        // Mock settings - in real app, this would come from a settings table
        const settings = {
            platform: {
                name: 'Harvest Hub',
                description: 'Digital Farmers Market Platform',
                email: 'admin@harvesthub.com',
                phone: '+1-555-0123',
                maintenance_mode: false
            },
            fees: {
                platform_fee_percentage: 5.0,
                payment_processing_fee: 2.9,
                minimum_order_amount: 10.00
            },
            limits: {
                max_products_per_producer: 100,
                max_order_items: 50,
                max_file_size_mb: 10
            },
            notifications: {
                email_notifications: true,
                sms_notifications: false,
                push_notifications: true
            }
        };

        res.json(settings);

    } catch (error) {
        console.error('Get platform settings error:', error);
        res.status(500).json({ message: 'Server error getting platform settings' });
    }
});

// Update platform settings
router.put('/settings', [
    body('platform').optional().isObject(),
    body('fees').optional().isObject(),
    body('limits').optional().isObject(),
    body('notifications').optional().isObject()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { platform, fees, limits, notifications } = req.body;
        
        // In a real app, you would save these to a settings table
        // For now, we'll just return success
        res.json({ message: 'Settings updated successfully' });

    } catch (error) {
        console.error('Update platform settings error:', error);
        res.status(500).json({ message: 'Server error updating platform settings' });
    }
});

// Get real-time dashboard stats
router.get('/stats/realtime', async (req, res) => {
    try {
        const db = getDb(req);
        
        // Get counts for today
        const today = new Date().toISOString().split('T')[0];
        
        const [todayStats] = await db.execute(`
            SELECT 
                COUNT(DISTINCT CASE WHEN DATE(u.created_at) = ? THEN u.id END) as new_users_today,
                COUNT(DISTINCT CASE WHEN DATE(o.created_at) = ? THEN o.id END) as orders_today,
                COALESCE(SUM(CASE WHEN DATE(o.created_at) = ? THEN o.total_amount END), 0) as revenue_today,
                COUNT(DISTINCT CASE WHEN pp.is_approved = FALSE THEN pp.id END) as pending_producers,
                COUNT(DISTINCT CASE WHEN p.is_approved = FALSE THEN p.id END) as pending_products
            FROM users u
            LEFT JOIN orders o ON 1=1
            LEFT JOIN producer_profiles pp ON 1=1
            LEFT JOIN products p ON 1=1
        `, [today, today, today]);

        const [activeUsers] = await db.execute(`
            SELECT COUNT(*) as active_users_now
            FROM users
            WHERE last_login >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `);

        const stats = {
            ...todayStats[0],
            active_users_now: activeUsers[0].active_users_now,
            timestamp: new Date().toISOString()
        };

        res.json(stats);

    } catch (error) {
        console.error('Get realtime stats error:', error);
        res.status(500).json({ message: 'Server error getting realtime stats' });
    }
});

// Get notifications
router.get('/notifications', async (req, res) => {
    try {
        const db = getDb(req);
        
        // Get pending items that need admin attention
        const [pendingProducers] = await db.execute(`
            SELECT COUNT(*) as count FROM producer_profiles WHERE is_approved = FALSE
        `);
        
        const [pendingProducts] = await db.execute(`
            SELECT COUNT(*) as count FROM products WHERE is_approved = FALSE
        `);
        
        const [newOrders] = await db.execute(`
            SELECT COUNT(*) as count FROM orders WHERE status = 'pending' AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `);

        const notifications = [
            {
                id: 1,
                type: 'producer_approval',
                title: 'Producer Approvals Needed',
                message: `${pendingProducers[0].count} producers awaiting approval`,
                count: pendingProducers[0].count,
                priority: 'high',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                type: 'product_approval',
                title: 'Product Reviews Needed',
                message: `${pendingProducts[0].count} products awaiting review`,
                count: pendingProducts[0].count,
                priority: 'medium',
                timestamp: new Date().toISOString()
            },
            {
                id: 3,
                type: 'new_orders',
                title: 'New Orders',
                message: `${newOrders[0].count} new orders in the last hour`,
                count: newOrders[0].count,
                priority: 'normal',
                timestamp: new Date().toISOString()
            }
        ].filter(notification => notification.count > 0);

        res.json(notifications);

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error getting notifications' });
    }
});

// Get recent activity for real-time feed
router.get('/recent-activity', async (req, res) => {
    try {
        const db = getDb(req);
        const { limit = 20 } = req.query;
        
        // Get recent activities from various tables
        const activities = [];
        
        // Recent user registrations
        const [newUsers] = await db.execute(`
            SELECT 
                'user_registration' as type,
                CONCAT('New user registered: ', first_name, ' ', last_name) as description,
                created_at,
                id as reference_id
            FROM users 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY created_at DESC
            LIMIT 5
        `);
        
        // Recent producer approvals
        const [producerApprovals] = await db.execute(`
            SELECT 
                'producer_approval' as type,
                CONCAT('Producer approved: ', pp.business_name) as description,
                pp.updated_at as created_at,
                pp.id as reference_id
            FROM producer_profiles pp
            WHERE pp.is_approved = TRUE 
            AND pp.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY pp.updated_at DESC
            LIMIT 5
        `);
        
        // Recent product approvals
        const [productApprovals] = await db.execute(`
            SELECT 
                'product_approval' as type,
                CONCAT('Product approved: ', p.name) as description,
                p.updated_at as created_at,
                p.id as reference_id
            FROM products p
            WHERE p.is_approved = TRUE 
            AND p.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY p.updated_at DESC
            LIMIT 5
        `);
        
        // Recent orders
        const [newOrders] = await db.execute(`
            SELECT 
                'order_placed' as type,
                CONCAT('New order #', o.id, ' placed by ', u.first_name, ' ', u.last_name) as description,
                o.created_at,
                o.id as reference_id
            FROM orders o
            JOIN users u ON o.customer_id = u.id
            WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            ORDER BY o.created_at DESC
            LIMIT 10
        `);
        
        // Recent order status changes
        const [orderUpdates] = await db.execute(`
            SELECT 
                'order_status_change' as type,
                CONCAT('Order #', o.id, ' marked as ', o.status) as description,
                o.updated_at as created_at,
                o.id as reference_id
            FROM orders o
            WHERE o.updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
            AND o.updated_at != o.created_at
            ORDER BY o.updated_at DESC
            LIMIT 5
        `);
        
        // Combine all activities
        activities.push(...newUsers, ...producerApprovals, ...productApprovals, ...newOrders, ...orderUpdates);
        
        // Sort by creation time and limit results
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const limitedActivities = activities.slice(0, parseInt(limit));
        
        res.json(limitedActivities);
        
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ message: 'Server error getting recent activity' });
    }
});

// Get pending stats for dashboard
router.get('/pending-stats', async (req, res) => {
    try {
        const db = getDb(req);
        
        const [pendingProducers] = await db.execute(`
            SELECT COUNT(*) as count FROM producer_profiles WHERE is_approved = FALSE
        `);
        
        const [pendingProducts] = await db.execute(`
            SELECT COUNT(*) as count FROM products WHERE is_approved = FALSE
        `);
        
        const [pendingOrders] = await db.execute(`
            SELECT COUNT(*) as count FROM orders WHERE status = 'pending'
        `);
        
        res.json({
            pending_producers: pendingProducers[0].count,
            pending_products: pendingProducts[0].count,
            pending_orders: pendingOrders[0].count,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Get pending stats error:', error);
        res.status(500).json({ message: 'Server error getting pending stats' });
    }
});

// Admin profile endpoints
router.get('/profile', async (req, res) => {
    try {
        // In a real app, you'd get this from the authenticated admin user
        const profile = {
            id: 1,
            first_name: 'Admin',
            last_name: 'User',
            email: 'admin@harvesthub.com',
            phone: '+1-555-0123',
            role: 'admin',
            created_at: '2024-01-01T00:00:00Z',
            last_login: new Date().toISOString(),
            preferences: {
                email_notifications: true,
                dashboard_theme: 'light',
                timezone: 'UTC-5'
            }
        };
        
        res.json(profile);
        
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ message: 'Server error getting admin profile' });
    }
});

// Update admin preferences
router.put('/preferences', [
    body('email_notifications').optional().isBoolean(),
    body('dashboard_theme').optional().isIn(['light', 'dark', 'auto']),
    body('timezone').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        // In a real app, you'd save these to the database
        const preferences = req.body;
        console.log('Admin preferences updated:', preferences);
        
        res.json({ message: 'Preferences updated successfully' });
        
    } catch (error) {
        console.error('Update admin preferences error:', error);
        res.status(500).json({ message: 'Server error updating preferences' });
    }
});

// Get admin sessions
router.get('/sessions', async (req, res) => {
    try {
        // Mock session data - in a real app, you'd store this in database or Redis
        const sessions = [
            {
                id: '1',
                device_name: 'Windows Desktop',
                device_type: 'desktop',
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ip_address: '192.168.1.100',
                location: 'New York, NY',
                last_activity: new Date(Date.now() - 300000).toISOString(), // 5 min ago
                is_current: true
            },
            {
                id: '2',
                device_name: 'iPhone 15',
                device_type: 'mobile',
                user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                ip_address: '10.0.0.50',
                location: 'New York, NY',
                last_activity: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                is_current: false
            }
        ];
        
        res.json(sessions);
        
    } catch (error) {
        console.error('Get admin sessions error:', error);
        res.status(500).json({ message: 'Server error getting sessions' });
    }
});

// Revoke admin session
router.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // In a real app, you'd remove the session from your session store
        console.log('Session revoked:', sessionId);
        
        res.json({ message: 'Session revoked successfully' });
        
    } catch (error) {
        console.error('Revoke session error:', error);
        res.status(500).json({ message: 'Server error revoking session' });
    }
});

module.exports = router;
