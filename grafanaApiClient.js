// Importing Axios
const axios = require("axios");
const dayjs = require("dayjs");
require("dotenv").config(); // Load environment variables

// Function to get dynamic Unix timestamps using dayjs
const getTimestamps = (startOffset, endOffset) => {
  const now = dayjs(); // Current time
  const start = now.subtract(startOffset, "seconds").unix(); // Start time
  const end = now.subtract(endOffset, "seconds").unix(); // End time
  return { start, end };
};
// Example Usage
const offsets = {
  startOffset: 3600, // 1 hour ago
  endOffset: 0, // Current time
};

// Function to fetch metrics from Grafana (or Prometheus)
const fetchMetrics = async () => {
  const token = process.env.GRAPHANA_TOKEN;
  const datasourceId = "5";
  const query = "up";
  const step = "60";
  const { start, end } = getTimestamps(offsets.startOffset, offsets.endOffset);
  // Construct the dynamic URL using template literals
  const grafanaApiUrl = `https://ravindranathk.grafana.net/api/datasources/proxy/${datasourceId}/api/v1/query_range?query=${encodeURIComponent(
    query
  )}&start=${start}&end=${end}&step=${step}`;

  try {
    // Send the GET request
    const response = await axios.get(grafanaApiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Return the data from the response
    return response.data;
  } catch (error) {
    // Handle errors
    console.error("Error fetching metrics:", error);
    throw error; // Rethrow error to handle it in the calling code
  }
};

fetchMetrics()
  .then((data) => {
    console.log("Metrics Data:", data);
  })
  .catch((error) => {
    console.error("Failed to fetch metrics:", error);
  });

module.exports = fetchMetrics;
