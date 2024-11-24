// Import dependencies
const promClient = require("prom-client");
const fetchMetrics = require("./grafanaApiClient");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

// Initialize express app and port
const app = express();
const port = 8080;

// Initialize Prometheus client and registry
const register = new promClient.Registry();

// Default metric (HTTP request count)
const httpRequestCount = new promClient.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "status"],
});

// Request duration histogram
const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Histogram of HTTP request durations",
  labelNames: ["method", "status", "path"],
  buckets: [0.1, 0.5, 1, 2, 5, 10], // Customize your duration buckets as needed
});

// Middleware to track request counts and durations
const trackRequestMetrics = (req, res, next) => {
  const end = httpRequestDuration.startTimer(); // Start measuring the duration

  // Increment request count for this method, status, and path
  res.on("finish", () => {
    httpRequestCount.inc({
      method: req.method,
      status: res.statusCode,
      path: req.path,
    });

    // Stop the timer and record the duration
    end({
      method: req.method,
      status: res.statusCode,
      path: req.path,
    });
  });

  next(); // Proceed to the next middleware or route handler
};

// Route to expose metrics
app.get("/metrics", async (req, res) => {
  const requestId = uuidv4(); // Generate a new UUID for each request
  const metrics = await register.metrics();

  // Return metrics as JSON with UUID
  res.json({
    requestId,
    metrics,
  });
});

// Call fetchMetrics function at startup
fetchMetrics();

// Basic route to respond with a Hello message and a new UUID
app.get("/", (req, res) => {
  res.json({
    message: "Hello World",
    requestId: uuidv4(),
  });
});

// A catch-all route to handle any path
app.all("*", (req, res) => {
  res.send(`Caught request for path: ${req.path}`);
});

// Use middleware for tracking request metrics
app.use(trackRequestMetrics);

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
