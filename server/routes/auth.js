const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Middleware to get database connection
const getDb = (req) => req.app.locals.db;

// Validation middleware
const validateRegistration = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().isLength({ min: 2 }),
    body('lastName').trim().isLength({ min: 2 })
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, phone, role = 'customer' } = req.body;
        const db = getDb(req);

        // Check if user already exists
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await db.execute(
            'INSERT INTO users (email, password, first_name, last_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, firstName, lastName, phone, role]
        );

        const userId = result.insertId;

        // If registering as producer, create producer profile
        if (role === 'producer') {
            await db.execute(
                'INSERT INTO producer_profiles (user_id, business_name, description) VALUES (?, ?, ?)',
                [userId, `${firstName} ${lastName}'s Business`, 'Business description']
            );
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId, email, role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Get user data (without password)
        const [users] = await db.execute(
            'SELECT id, email, first_name, last_name, phone, role, is_verified, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: users[0]
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        const db = getDb(req);

        // Find user by email
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete user.password;

        res.json({
            message: 'Login successful',
            token,
            user
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user profile
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const db = getDb(req);

        const [users] = await db.execute(
            'SELECT id, email, first_name, last_name, phone, role, is_verified, profile_image, created_at FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // If user is a producer, get producer profile
        if (user.role === 'producer') {
            const [producerProfiles] = await db.execute(
                'SELECT * FROM producer_profiles WHERE user_id = ?',
                [user.id]
            );
            
            if (producerProfiles.length > 0) {
                user.producerProfile = producerProfiles[0];
            }
        }

        res.json({ user });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error getting profile' });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Invalid password data' });
        }

        const db = getDb(req);

        // Get current user
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, decoded.userId]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }
        
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error changing password' });
    }
});

module.exports = router; 