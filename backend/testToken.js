const jwt = require("jsonwebtoken");
require('dotenv').config();

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Iiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDExNjAwMTYsImV4cCI6MTc0MTE2MzYxNn0.Az1sXdXL6uJj5-8SqGnkO15wxsShYgqX4VIbMxSgqYM";

try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token is valid:", decoded);
} catch (error) {
    console.error("❌ Invalid token:", error.message);
}
