const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Get all producers with optional filtering
router.get('/', async (req, res) => {
    try {
        const { search, category, rating, city, state } = req.query;
        const db = getDb(req);

        let query = `
            SELECT pp.*, u.first_name, u.last_name, u.email, u.phone,
                   COUNT(DISTINCT p.id) as product_count,
                   AVG(p.price) as avg_product_price
            FROM producer_profiles pp
            JOIN users u ON pp.user_id = u.id
            LEFT JOIN products p ON pp.id = p.producer_id AND p.is_available = TRUE AND p.is_approved = TRUE
            WHERE pp.is_approved = TRUE
        `;
        
        const params = [];

        // Add filters
        if (search) {
            query += ' AND (pp.business_name LIKE ? OR pp.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (category) {
            query += ' AND EXISTS (SELECT 1 FROM products p2 WHERE p2.producer_id = pp.id AND p2.category_id = ? AND p2.is_available = TRUE)';
            params.push(category);
        }

        if (rating) {
            query += ' AND pp.rating >= ?';
            params.push(rating);
        }

        if (city) {
            query += ' AND pp.address_city LIKE ?';
            params.push(`%${city}%`);
        }

        if (state) {
            query += ' AND pp.address_state = ?';
            params.push(state);
        }

        query += ' GROUP BY pp.id ORDER BY pp.rating DESC, pp.total_reviews DESC';

        const [producers] = await db.execute(query, params);

        res.json(producers);

    } catch (error) {
        console.error('Get producers error:', error);
        res.status(500).json({ message: 'Server error getting producers' });
    }
});

// Get featured producers
router.get('/featured', async (req, res) => {
    try {
        const db = getDb(req);
        
        const [producers] = await db.execute(`
            SELECT pp.*, u.first_name, u.last_name,
                   COUNT(DISTINCT p.id) as product_count
            FROM producer_profiles pp
            JOIN users u ON pp.user_id = u.id
            LEFT JOIN products p ON pp.id = p.producer_id AND p.is_available = TRUE AND p.is_approved = TRUE
            WHERE pp.is_approved = TRUE AND pp.rating >= 4.0
            GROUP BY pp.id
            ORDER BY pp.rating DESC, pp.total_reviews DESC
            LIMIT 6
        `);

        res.json(producers);

    } catch (error) {
        console.error('Get featured producers error:', error);
        res.status(500).json({ message: 'Server error getting featured producers' });
    }
});

// Get producer by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const [producers] = await db.execute(`
            SELECT pp.*, u.first_name, u.last_name, u.email, u.phone, u.created_at as user_created_at
            FROM producer_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.id = ? AND pp.is_approved = TRUE
        `, [id]);

        if (producers.length === 0) {
            return res.status(404).json({ message: 'Producer not found' });
        }

        const producer = producers[0];

        // Get producer's products
        const [products] = await db.execute(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.producer_id = ? AND p.is_available = TRUE
            ORDER BY p.created_at DESC
        `, [id]);

        // Get producer's reviews
        const [reviews] = await db.execute(`
            SELECT r.*, u.first_name, u.last_name, p.name as product_name
            FROM reviews r
            JOIN users u ON r.customer_id = u.id
            LEFT JOIN products p ON r.product_id = p.id
            WHERE r.producer_id = ?
            ORDER BY r.created_at DESC
            LIMIT 10
        `, [id]);

        // Get business hours
        let businessHours = {};
        try {
            if (producer.business_hours) {
                businessHours = JSON.parse(producer.business_hours);
            }
        } catch (e) {
            businessHours = {};
        }

        producer.products = products;
        producer.reviews = reviews;
        producer.business_hours = businessHours;

        res.json(producer);

    } catch (error) {
        console.error('Get producer error:', error);
        res.status(500).json({ message: 'Server error getting producer' });
    }
});

// Create producer profile (when user registers as producer)
router.post('/', [
    body('user_id').isInt({ min: 1 }),
    body('business_name').trim().isLength({ min: 2, max: 255 }),
    body('description').trim().isLength({ min: 10 }),
    body('address_street').trim().isLength({ min: 5 }),
    body('address_city').trim().isLength({ min: 2 }),
    body('address_state').trim().isLength({ min: 2, max: 50 }),
    body('address_zip').trim().isLength({ min: 5, max: 20 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            user_id, business_name, description, address_street, address_city, 
            address_state, address_zip, latitude, longitude, business_hours
        } = req.body;

        const db = getDb(req);

        // Check if user exists and is not already a producer
        const [users] = await db.execute(
            'SELECT id, role FROM users WHERE id = ?',
            [user_id]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (users[0].role !== 'producer') {
            return res.status(400).json({ message: 'User is not registered as a producer' });
        }

        // Check if producer profile already exists
        const [existingProfiles] = await db.execute(
            'SELECT id FROM producer_profiles WHERE user_id = ?',
            [user_id]
        );

        if (existingProfiles.length > 0) {
            return res.status(400).json({ message: 'Producer profile already exists' });
        }

        // Create producer profile
        const [result] = await db.execute(`
            INSERT INTO producer_profiles (
                user_id, business_name, description, address_street, address_city, 
                address_state, address_zip, latitude, longitude, business_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [user_id, business_name, description, address_street, address_city, 
             address_state, address_zip, latitude, longitude, business_hours]);

        const profileId = result.insertId;

        // Get created profile
        const [profiles] = await db.execute(
            'SELECT * FROM producer_profiles WHERE id = ?',
            [profileId]
        );

        res.status(201).json({
            message: 'Producer profile created successfully',
            profile: profiles[0]
        });

    } catch (error) {
        console.error('Create producer profile error:', error);
        res.status(500).json({ message: 'Server error creating producer profile' });
    }
});

// Update producer profile
router.put('/:id', [
    body('business_name').trim().isLength({ min: 2, max: 255 }),
    body('description').trim().isLength({ min: 10 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const {
            business_name, description, address_street, address_city, 
            address_state, address_zip, latitude, longitude, business_hours,
            delivery_radius
        } = req.body;

        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify producer owns this profile

        // Update profile
        await db.execute(`
            UPDATE producer_profiles 
            SET business_name = ?, description = ?, address_street = ?, address_city = ?,
                address_state = ?, address_zip = ?, latitude = ?, longitude = ?, 
                business_hours = ?, delivery_radius = ?
            WHERE id = ?
        `, [business_name, description, address_street, address_city, 
             address_state, address_zip, latitude, longitude, business_hours, 
             delivery_radius, id]);

        // Get updated profile
        const [profiles] = await db.execute(
            'SELECT * FROM producer_profiles WHERE id = ?',
            [id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({ message: 'Producer profile not found' });
        }

        res.json({
            message: 'Producer profile updated successfully',
            profile: profiles[0]
        });

    } catch (error) {
        console.error('Update producer profile error:', error);
        res.status(500).json({ message: 'Server error updating producer profile' });
    }
});

// Get producers by location (for geospatial search)
router.get('/nearby/:latitude/:longitude', async (req, res) => {
    try {
        const { latitude, longitude, radius = 25 } = req.params;
        const db = getDb(req);

        // Simple distance calculation using Haversine formula
        const [producers] = await db.execute(`
            SELECT pp.*, u.first_name, u.last_name,
                   (6371 * acos(cos(radians(?)) * cos(radians(pp.latitude)) * 
                    cos(radians(pp.longitude) - radians(?)) + 
                    sin(radians(?)) * sin(radians(pp.latitude)))) AS distance
            FROM producer_profiles pp
            JOIN users u ON pp.user_id = u.id
            WHERE pp.is_approved = TRUE 
            AND pp.latitude IS NOT NULL 
            AND pp.longitude IS NOT NULL
            HAVING distance <= ?
            ORDER BY distance ASC
        `, [latitude, longitude, latitude, radius]);

        res.json(producers);

    } catch (error) {
        console.error('Get nearby producers error:', error);
        res.status(500).json({ message: 'Server error getting nearby producers' });
    }
});

module.exports = router; 