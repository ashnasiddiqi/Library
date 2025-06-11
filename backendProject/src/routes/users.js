import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { JWT_SECRET } from "../db.js";

const router = express.Router();

// Input validation function
const validateInput = (username, email, password) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!username || username.length < 3 || username.length > 50) {
    return "Username must be between 3 and 50 characters";
  }
  if (!email || !emailRegex.test(email)) {
    return "Invalid email format";
  }
  if (!password || password.length < 4) {
    return "Password must be at least 4 characters long";
  }
  return null;
};

// POST /register - Register a new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Registration attempt:", { username, email }); // Debug log

  const validationError = validateInput(username, email, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id AS id, username, email",
      [username, email, hashedPassword]
    );

    console.log("User registered successfully:", newUser.rows[0]); // Debug log
    res.status(201).json({ user: newUser.rows[0] });
  } catch (error) {
    console.error("Registration error:", error); // Detailed error log
    res.status(500).json({ error: error.message || "Server error" });
  }
});

// POST /login - Login a user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", { email }); // Debug log

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("User logged in successfully:", { id: user.user_id, email: user.email }); // Debug log
    res.json({
      token,
      user: { id: user.user_id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error); // Detailed error log
    res.status(500).json({ error: error.message || "Server error" });
  }
});

export default router;