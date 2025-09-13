const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "harvest_hub",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
pool
  .getConnection()
  .then((connection) => {
    console.log("Connected to MySQL database");
    connection.release();
  })
  .catch((err) => {
    console.error("MySQL connection error:", err);
  });
// ... existing code before middleware ...

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
  })
);
app.use(compression());

// Define the list of approved frontend URLs
const allowedOrigins = [
  "http://127.0.0.1:5500", // For local testing with Live Server
  "https://phali003.github.io", // Your live GitHub Pages site
];

// Secure CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests that don't have an origin (like Postman or mobile apps)
      if (!origin) return callback(null, true);

      // If the incoming request's origin is NOT in our approved list, reject it
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }

      // If the origin is in our approved list, allow it
      return callback(null, true);
    },
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Make pool available to routes
app.locals.db = pool;

// Debug route to test server
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
    staticPath: path.join(__dirname, "../public"),
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/producers", require("./routes/producers"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/categories", require("./routes/categories"));

// Serve the main HTML file
app.get("/", (req, res) => {
  const htmlPath = path.join(__dirname, "../public/index.html");
  console.log("Serving HTML from:", htmlPath);
  res.sendFile(htmlPath);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at: http://localhost:${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, "../public")}`);
  console.log(
    `HTML file location: ${path.join(__dirname, "../public/index.html")}`
  );
});
