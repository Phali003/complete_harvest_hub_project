require("dotenv").config();
console.log("DB_HOST:", process.env.DB_HOST);
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Build SSL options for DB (allow dev overrides)
let sslOptions = undefined;
try {
  // If DB_SSL_CA_CONTENT is provided (raw PEM or base64), decode/write it to a temp file
  if (process.env.DB_SSL_CA_CONTENT) {
    try {
      let content = process.env.DB_SSL_CA_CONTENT.trim();
      let pemBuffer;

      // If the content looks like a PEM (contains BEGIN marker), treat as raw PEM
      if (content.includes("-----BEGIN CERTIFICATE-----")) {
        // Preserve newline characters if present; write as utf8
        pemBuffer = Buffer.from(content, "utf8");
      } else {
        // Assume base64-encoded
        pemBuffer = Buffer.from(content, "base64");
      }

      const outPath = path.join(os.tmpdir(), "db_ca.pem");
      fs.writeFileSync(outPath, pemBuffer, { mode: 0o600 });
      // expose path for downstream ssl logic
      process.env.DB_SSL_CA = outPath;
      console.log("DB CA written to", outPath);
    } catch (err) {
      console.error("Failed to process DB_SSL_CA_CONTENT env var:", err);
    }
  }

  const rejectUnauthorized = process.env.DB_REJECT_UNAUTHORIZED;
  const caPath = process.env.DB_SSL_CA; // path to CA pem file (optional)

  if (caPath) {
    const ca = fs.readFileSync(caPath, "utf8");
    sslOptions = { ca };
  } else if (
    rejectUnauthorized &&
    rejectUnauthorized.toLowerCase() === "false"
  ) {
    // allow self-signed certs in development
    sslOptions = { rejectUnauthorized: false };
  } else {
    // default: strict
    sslOptions = { rejectUnauthorized: true };
  }
} catch (err) {
  console.warn(
    "Failed to build DB SSL options from env vars, falling back to default SSL behavior:",
    err.message
  );
  sslOptions = { rejectUnauthorized: true };
}

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "harvest_hub",
  port: process.env.DB_PORT || 4000,
  ssl: sslOptions,
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
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests that don't have an origin (like Postman or mobile apps)
//       if (!origin) return callback(null, true);

//       // If the incoming request's origin is NOT in our approved list, reject it
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }

//       // If the origin is in our approved list, allow it
//       return callback(null, true);
//     },
//   })
// );

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// Health check: verifies DB connectivity and presence of `users` table
app.get("/api/health", async (req, res) => {
  try {
    const pool = req.app.locals.db;
    // simple ping
    await pool.query("SELECT 1");

    // check for users table in the configured DB
    const dbName = process.env.DB_NAME || "harvest_hub";
    const [rows] = await pool.query(
      "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ? AND table_name = ? LIMIT 1",
      [dbName, "users"]
    );

    res.json({
      ok: true,
      db: dbName,
      users_table_exists: rows.length > 0,
    });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
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

// Create HTTP server and setup WebSocket
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("Admin client connected:", socket.id);

  // Join admin room for real-time updates
  socket.join("admin");

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Admin client disconnected:", socket.id);
  });

  // Handle real-time stats request
  socket.on("requestStats", async () => {
    try {
      const db = pool;
      const today = new Date().toISOString().split("T")[0];

      const [todayStats] = await db.execute(
        `
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
      `,
        [today, today, today]
      );

      socket.emit("statsUpdate", {
        ...todayStats[0],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending stats:", error);
      socket.emit("statsError", { error: error.message });
    }
  });
});

// Make io available globally for other routes to emit events
app.locals.io = io;

// Function to broadcast real-time updates
const broadcastAdminUpdate = (event, data) => {
  io.to("admin").emit(event, data);
};

// Make broadcast function available globally
global.broadcastAdminUpdate = broadcastAdminUpdate;

// Send periodic updates
setInterval(async () => {
  try {
    const db = pool;

    // Get notification counts
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
        type: "producer_approval",
        count: pendingProducers[0].count,
        message: `${pendingProducers[0].count} producers awaiting approval`,
      },
      {
        id: 2,
        type: "product_approval",
        count: pendingProducts[0].count,
        message: `${pendingProducts[0].count} products awaiting review`,
      },
      {
        id: 3,
        type: "new_orders",
        count: newOrders[0].count,
        message: `${newOrders[0].count} new orders in the last hour`,
      },
    ].filter((n) => n.count > 0);

    broadcastAdminUpdate("notificationUpdate", notifications);
  } catch (error) {
    console.error("Error broadcasting updates:", error);
  }
}, 30000); // Update every 30 seconds

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend available at: http://localhost:${PORT}`);
  console.log(`WebSocket server running for real-time updates`);
  console.log(`Static files served from: ${path.join(__dirname, "../public")}`);
  console.log(
    `HTML file location: ${path.join(__dirname, "../public/index.html")}`
  );
});
