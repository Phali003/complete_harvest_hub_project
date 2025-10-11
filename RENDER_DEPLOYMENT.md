# Render Deployment Guide for Harvest Hub

## Prerequisites
1. GitHub repository is up-to-date and pushed
2. Render account created (https://render.com)
3. Database credentials ready (MySQL database)
4. Email service credentials ready
5. Stripe API keys ready

## Deployment Steps

### 1. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" > "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository: `complete_harvest_hub_project`
5. Configure the service:
   - **Name**: `harvest-hub`
   - **Region**: Choose your preferred region
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 2. Environment Variables Setup

Add the following environment variables in Render Dashboard:

#### Server Configuration
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render will set this automatically)

#### Database Configuration
- `DB_HOST` = Your database host (e.g., from PlanetScale, AWS RDS, etc.)
- `DB_PORT` = `3306` (or your database port)
- `DB_USER` = Your database username
- `DB_PASSWORD` = Your database password
- `DB_NAME` = `harvest_hub`
- `DB_REJECT_UNAUTHORIZED` = `true` (for production SSL)

#### JWT Configuration
- `JWT_SECRET` = Generate a secure random string (32+ characters)

#### Email Configuration (choose one)
**Option A: Gmail SMTP**
- `SMTP_HOST` = `smtp.gmail.com`
- `SMTP_PORT` = `587`
- `EMAIL_USER` = Your Gmail address
- `EMAIL_PASSWORD` = Your Gmail app password
- `EMAIL_FROM` = Your sender email
- `MAILER_ENABLED` = `true`
- `MAILER_DRIVER` = `smtp`

**Option B: MailerSend**
- `MAILERSEND_API_KEY` = Your MailerSend API key
- `EMAIL_FROM` = Your verified sender email
- `MAILER_ENABLED` = `true`
- `MAILER_DRIVER` = `mailersend`

#### Frontend Configuration
- `FRONTEND_URL` = Your Render app URL (e.g., `https://harvest-hub.onrender.com`)

#### Payment Configuration
- `STRIPE_SECRET_KEY` = Your Stripe secret key (use live key for production)

#### Optional
- `SENTRY_DSN` = Your Sentry DSN for error tracking

### 3. Database Setup

You'll need a MySQL database. Options:

#### Option A: PlanetScale (Recommended)
1. Create a PlanetScale account
2. Create a new database
3. Get connection details and add to Render env vars

#### Option B: AWS RDS
1. Create MySQL instance on AWS RDS
2. Configure security groups for Render IP ranges
3. Get connection details and add to Render env vars

#### Option C: Render PostgreSQL (Alternative)
If you want to switch to PostgreSQL:
1. Create a PostgreSQL database on Render
2. Update your code to use PostgreSQL instead of MySQL

### 4. Database Schema Setup

After deployment, you'll need to run your database schema:

1. Use your database management tool to run the SQL in `database/schema.sql`
2. Or connect to your database and import the schema manually

### 5. Static File Serving

Your app serves static files from the `public` directory. This should work automatically with the current Express setup.

### 6. Health Check

The app should respond to health checks at the root path (`/`). Your `public/index.html` should handle this.

## Post-Deployment Checklist

- [ ] App deploys successfully
- [ ] Database connection works
- [ ] Static files (CSS, JS) load correctly
- [ ] User registration/login works
- [ ] Email sending works (test password reset)
- [ ] Payment processing works (test with Stripe test cards)
- [ ] All API endpoints respond correctly

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check DB credentials in environment variables
   - Verify database is accessible from Render
   - Check SSL/TLS settings

2. **Static Files Not Loading**
   - Verify `public` directory structure
   - Check CORS settings for your domain

3. **Email Not Sending**
   - Verify email credentials
   - Check if using Gmail: enable 2FA and use app password

4. **Build Fails**
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

### Logs Access
- View deployment and runtime logs in Render Dashboard
- Use logs to debug any issues

## Environment Variables Quick Reference

```bash
# Required for basic functionality
NODE_ENV=production
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=harvest_hub
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://your-app.onrender.com

# Required for email functionality
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
MAILER_ENABLED=true

# Required for payments
STRIPE_SECRET_KEY=your_stripe_key
```