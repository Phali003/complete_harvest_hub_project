const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 login attempts per windowMs
    message: { 
        success: false, 
        message: 'Too many login attempts from this IP, please try again after 15 minutes' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting for password reset requests
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each IP to 3 password reset attempts per windowMs
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});


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

const validateForgotPassword = [
    body('identifier').notEmpty().withMessage('Email or phone number is required')
];

const validateResetPassword = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
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

// Login user with rate limiting
router.post('/login', loginLimiter, validateLogin, async (req, res) => {
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

// Forgot Password with rate limiting
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { identifier } = req.body; // Can be email or phone
        const db = getDb(req);

        // Check if user exists by email or phone
        const [users] = await db.execute(
            'SELECT id, email, first_name, last_name, phone FROM users WHERE email = ? OR phone = ?',
            [identifier, identifier]
        );

        if (users.length === 0) {
            // Don't reveal whether user exists or not for security
            return res.status(404).json({ 
                message: 'If an account with this email or phone number exists, we\'ve sent a password reset link.' 
            });
        }

        const user = users[0];
        
        // Only proceed if the identifier is an email (we can't send SMS yet)
        if (!user.email || !identifier.includes('@')) {
            return res.status(400).json({ 
                message: 'Password reset is only available via email. Please enter your email address.' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

        // Clean up expired tokens for this email
        await db.execute(
            'DELETE FROM password_reset_tokens WHERE email = ? AND expires_at < NOW()',
            [user.email]
        );

        // Store reset token
        await db.execute(
            'INSERT INTO password_reset_tokens (email, phone, token, expires_at) VALUES (?, ?, ?, ?)',
            [user.email, user.phone, resetToken, expiresAt]
        );

        // Send reset email
        const emailResult = await emailService.sendPasswordResetEmail(user.email, resetToken);
        
        if (!emailResult.success) {
            console.error('Failed to send password reset email:', emailResult.error);
            return res.status(500).json({ message: 'Failed to send password reset email. Please try again later.' });
        }

        res.json({ 
            message: 'Password reset email sent successfully. Please check your inbox.' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
});

// Reset Password
router.post('/reset-password', validateResetPassword, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { token, newPassword } = req.body;
        const db = getDb(req);

        // Find valid reset token
        const [resetTokens] = await db.execute(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
            [token]
        );

        if (resetTokens.length === 0) {
            return res.status(400).json({ 
                message: 'Invalid or expired reset token. Please request a new password reset.' 
            });
        }

        const resetTokenData = resetTokens[0];

        // Find user by email
        const [users] = await db.execute(
            'SELECT id, email FROM users WHERE email = ?',
            [resetTokenData.email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update password
            await connection.execute(
                'UPDATE users SET password = ? WHERE id = ?',
                [hashedPassword, user.id]
            );

            // Mark token as used
            await connection.execute(
                'UPDATE password_reset_tokens SET used = TRUE, used_at = NOW() WHERE id = ?',
                [resetTokenData.id]
            );

            await connection.commit();
            connection.release();

            res.json({ message: 'Password reset successful. You can now log in with your new password.' });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

// Verify reset token (for checking if token is still valid)
router.get('/verify-reset-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const db = getDb(req);

        const [resetTokens] = await db.execute(
            'SELECT email, expires_at FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = FALSE',
            [token]
        );

        if (resetTokens.length === 0) {
            return res.status(400).json({ 
                valid: false,
                message: 'Invalid or expired reset token' 
            });
        }

        res.json({ 
            valid: true,
            email: resetTokens[0].email,
            expiresAt: resetTokens[0].expires_at
        });

    } catch (error) {
        console.error('Verify reset token error:', error);
        res.status(500).json({ message: 'Server error verifying reset token' });
    }
});

module.exports = router;
