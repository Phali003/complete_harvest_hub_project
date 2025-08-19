const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Get user profile
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        const [users] = await db.execute(`
            SELECT id, email, first_name, last_name, phone, role, is_verified, profile_image, created_at
            FROM users WHERE id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // If user is a producer, get producer profile
        if (user.role === 'producer') {
            const [producerProfiles] = await db.execute(`
                SELECT * FROM producer_profiles WHERE user_id = ?
            `, [id]);
            
            if (producerProfiles.length > 0) {
                user.producerProfile = producerProfiles[0];
            }
        }

        res.json(user);

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error getting user' });
    }
});

// Update user profile
router.put('/:id', [
    body('first_name').trim().isLength({ min: 2 }),
    body('last_name').trim().isLength({ min: 2 }),
    body('phone').optional().isMobilePhone()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { first_name, last_name, phone } = req.body;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // Update user
        await db.execute(`
            UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?
        `, [first_name, last_name, phone, id]);

        // Get updated user
        const [users] = await db.execute(`
            SELECT id, email, first_name, last_name, phone, role, is_verified, profile_image, created_at
            FROM users WHERE id = ?
        `, [id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User profile updated successfully',
            user: users[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error updating user' });
    }
});

// Update user profile image
router.patch('/:id/profile-image', async (req, res) => {
    try {
        const { id } = req.params;
        const { profile_image } = req.body;
        const db = getDb(req);

        if (!profile_image) {
            return res.status(400).json({ message: 'Profile image URL is required' });
        }

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // Update profile image
        await db.execute(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [profile_image, id]
        );

        res.json({ message: 'Profile image updated successfully' });

    } catch (error) {
        console.error('Update profile image error:', error);
        res.status(500).json({ message: 'Server error updating profile image' });
    }
});

// Get user preferences
router.get('/:id/preferences', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // For now, return default preferences
        // In a real implementation, you might have a separate preferences table
        const preferences = {
            favoriteCategories: [],
            deliveryRadius: 25,
            notifications: {
                email: true,
                sms: false,
                push: true
            }
        };

        res.json(preferences);

    } catch (error) {
        console.error('Get user preferences error:', error);
        res.status(500).json({ message: 'Server error getting user preferences' });
    }
});

// Update user preferences
router.put('/:id/preferences', async (req, res) => {
    try {
        const { id } = req.params;
        const { favoriteCategories, deliveryRadius, notifications } = req.body;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // In a real implementation, you would update a preferences table
        // For now, just return success
        res.json({ message: 'Preferences updated successfully' });

    } catch (error) {
        console.error('Update user preferences error:', error);
        res.status(500).json({ message: 'Server error updating user preferences' });
    }
});

// Get user address
router.get('/:id/address', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // For now, return empty address
        // In a real implementation, you might have a separate addresses table
        const address = {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            coordinates: {
                lat: null,
                lng: null
            }
        };

        res.json(address);

    } catch (error) {
        console.error('Get user address error:', error);
        res.status(500).json({ message: 'Server error getting user address' });
    }
});

// Update user address
router.put('/:id/address', [
    body('street').trim().isLength({ min: 5 }),
    body('city').trim().isLength({ min: 2 }),
    body('state').trim().isLength({ min: 2, max: 50 }),
    body('zipCode').trim().isLength({ min: 5, max: 20 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { street, city, state, zipCode, coordinates } = req.body;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // In a real implementation, you would update an addresses table
        // For now, just return success
        res.json({ message: 'Address updated successfully' });

    } catch (error) {
        console.error('Update user address error:', error);
        res.status(500).json({ message: 'Server error updating user address' });
    }
});

// Delete user account
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb(req);

        // TODO: Add JWT authentication middleware to verify user owns this profile

        // Check if user exists
        const [users] = await db.execute(
            'SELECT id FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Soft delete - mark as inactive
        await db.execute(
            'UPDATE users SET is_verified = FALSE WHERE id = ?',
            [id]
        );

        res.json({ message: 'User account deleted successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

module.exports = router; 