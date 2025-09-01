const jwt = require("jsonwebtoken");
require('dotenv').config();

const testToken = jwt.sign({ id: "12345", role: "student" }, process.env.JWT_SECRET, { expiresIn: "1h" });

console.log("✅ New Test Token:", testToken);
