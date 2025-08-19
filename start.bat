@echo off
echo 🌾 Harvest Hub - Starting Platform...
echo.

echo 📦 Installing dependencies...
npm install

echo.
echo 🗄️  Please make sure MySQL is running and the database is set up
echo    Run: mysql -u root -p harvest_hub < database/schema.sql
echo.

echo 🚀 Starting the server...
npm run dev

pause 