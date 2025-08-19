const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Get payment by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const [payments] = await db.execute(`
            SELECT p.*, o.total_amount, o.status as order_status
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = ?
        `, [id]);

        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payments[0]);

    } catch (error) {
        console.error('Get payment error:', error);
        res.status(500).json({ message: 'Server error getting payment' });
    }
});

// Create payment for order
router.post('/', [
    body('order_id').isInt({ min: 1 }),
    body('amount').isFloat({ min: 0.01 }),
    body('payment_method').isIn(['stripe', 'paypal', 'cash', 'bank_transfer']),
    body('transaction_id').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { order_id, amount, payment_method, transaction_id } = req.body;
        const db = getDb(req);

        // Verify order exists and amount matches
        const [orders] = await db.execute(`
            SELECT total_amount, status FROM orders WHERE id = ?
        `, [order_id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];
        if (order.status === 'cancelled') {
            return res.status(400).json({ message: 'Cannot process payment for cancelled order' });
        }

        if (Math.abs(order.total_amount - amount) > 0.01) {
            return res.status(400).json({ message: 'Payment amount does not match order total' });
        }

        // Create payment record
        const [result] = await db.execute(`
            INSERT INTO payments (order_id, amount, payment_method, transaction_id, status)
            VALUES (?, ?, ?, ?, 'pending')
        `, [order_id, amount, payment_method, transaction_id]);

        const paymentId = result.insertId;

        // Get created payment
        const [payments] = await db.execute(
            'SELECT * FROM payments WHERE id = ?',
            [paymentId]
        );

        res.status(201).json({
            message: 'Payment created successfully',
            payment: payments[0]
        });

    } catch (error) {
        console.error('Create payment error:', error);
        res.status(500).json({ message: 'Server error creating payment' });
    }
});

// Update payment status
router.patch('/:id/status', [
    body('status').isIn(['pending', 'completed', 'failed', 'refunded']),
    body('transaction_id').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { status, transaction_id } = req.body;
        const db = getDb(req);

        // Update payment status
        if (transaction_id) {
            await db.execute(`
                UPDATE payments SET status = ?, transaction_id = ? WHERE id = ?
            `, [status, transaction_id, id]);
        } else {
            await db.execute(
                'UPDATE payments SET status = ? WHERE id = ?',
                [status, id]
            );
        }

        // If payment is completed, update order status
        if (status === 'completed') {
            const [payments] = await db.execute(`
                SELECT order_id FROM payments WHERE id = ?
            `, [id]);

            if (payments.length > 0) {
                await db.execute(`
                    UPDATE orders SET status = 'confirmed' WHERE id = ?
                `, [payments[0].order_id]);
            }
        }

        // Get updated payment
        const [updatedPayments] = await db.execute(
            'SELECT * FROM payments WHERE id = ?',
            [id]
        );

        if (updatedPayments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json({
            message: 'Payment status updated successfully',
            payment: updatedPayments[0]
        });

    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ message: 'Server error updating payment status' });
    }
});

// Process refund
router.post('/:id/refund', [
    body('refund_amount').isFloat({ min: 0.01 }),
    body('reason').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { refund_amount, reason } = req.body;
        const db = getDb(req);

        // Get payment details
        const [payments] = await db.execute(`
            SELECT p.*, o.status as order_status
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = ?
        `, [id]);

        if (payments.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const payment = payments[0];

        if (payment.status !== 'completed') {
            return res.status(400).json({ message: 'Can only refund completed payments' });
        }

        if (refund_amount > payment.amount) {
            return res.status(400).json({ message: 'Refund amount cannot exceed payment amount' });
        }

        // Update payment status to refunded
        await db.execute(`
            UPDATE payments SET status = 'refunded' WHERE id = ?
        `, [id]);

        // If full refund, update order status
        if (Math.abs(refund_amount - payment.amount) < 0.01) {
            await db.execute(`
                UPDATE orders SET status = 'cancelled' WHERE id = ?
            `, [payment.order_id]);
        }

        res.json({
            message: 'Refund processed successfully',
            refund_amount,
            reason
        });

    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({ message: 'Server error processing refund' });
    }
});

// Get payment history for user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const db = getDb(req);

        const offset = (page - 1) * limit;

        const [payments] = await db.execute(`
            SELECT p.*, o.total_amount, o.status as order_status, pp.business_name as producer_name
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            JOIN producer_profiles pp ON o.producer_id = pp.id
            WHERE o.customer_id = ?
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, parseInt(limit), offset]);

        res.json(payments);

    } catch (error) {
        console.error('Get user payments error:', error);
        res.status(500).json({ message: 'Server error getting user payments' });
    }
});

// Get payment statistics
router.get('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = getDb(req);

        const [stats] = await db.execute(`
            SELECT 
                COUNT(*) as total_payments,
                COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as successful_payments,
                COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments,
                COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as refunded_payments,
                SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_spent,
                AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as avg_payment_amount
            FROM payments p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_id = ?
        `, [userId]);

        res.json(stats[0]);

    } catch (error) {
        console.error('Get payment stats error:', error);
        res.status(500).json({ message: 'Server error getting payment statistics' });
    }
});

module.exports = router; 