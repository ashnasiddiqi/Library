import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../db.js";

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log("Received token:", token);
  
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded token:", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
};

// POST /ratings - Add a rating
router.post("/", verifyToken, async (req, res) => {
  const { google_book_id, rating } = req.body;
  console.log("Received rating request:", { google_book_id, rating, user_id: req.user.id });

  if (!google_book_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid rating value. Please provide a rating between 1 and 5." });
  }

  try {
    // First ensure the book exists
    const bookResult = await pool.query(
      "SELECT id FROM books WHERE google_book_id = $1",
      [google_book_id]
    );
    console.log("Book query result:", bookResult.rows);

    if (bookResult.rowCount === 0) {
      return res.status(404).json({ error: "Book not found. Please try again." });
    }

    const book_id = bookResult.rows[0].id;
    console.log("Found book_id:", book_id);

    const result = await pool.query(
      `INSERT INTO ratings (user_id, book_id, rating) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (book_id, user_id) 
       DO UPDATE SET rating = EXCLUDED.rating 
       RETURNING *`,
      [req.user.id, book_id, rating]
    );
    console.log("Rating insert result:", result.rows);

    if (!result.rows[0]) {
      throw new Error("Failed to save rating");
    }

    res.status(201).json({
      message: "Rating saved successfully",
      rating: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// GET /ratings/:google_book_id - Get all ratings for a book
router.get("/:google_book_id", async (req, res) => {
  const { google_book_id } = req.params;

  try {
    const bookResult = await pool.query(
      "SELECT id FROM books WHERE google_book_id = $1",
      [google_book_id]
    );
    
    if (bookResult.rowCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const book_id = bookResult.rows[0].id;
    
    const result = await pool.query(
      `SELECT r.rating, u.username AS reviewer, r.created_at
       FROM ratings r
       JOIN users u ON r.user_id = u.user_id
       WHERE r.book_id = $1
       ORDER BY r.created_at DESC`,
      [book_id]
    );

    res.json({ ratings: result.rows });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

// GET /ratings/:google_book_id/average - Get average rating for a book
router.get("/:google_book_id/average", async (req, res) => {
  const { google_book_id } = req.params;

  try {
    const bookResult = await pool.query(
      "SELECT id FROM books WHERE google_book_id = $1",
      [google_book_id]
    );
    
    if (bookResult.rowCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const book_id = bookResult.rows[0].id;
    
    const result = await pool.query(
      "SELECT AVG(rating) as average_rating, COUNT(rating) as rating_count FROM ratings WHERE book_id = $1",
      [book_id]
    );

    const average = parseFloat(result.rows[0].average_rating) || 0;
    const count = parseInt(result.rows[0].rating_count) || 0;

    res.json({ average_rating: average.toFixed(2), rating_count: count });
  } catch (error) {
    console.error("Error fetching average rating:", error);
    res.status(500).json({ error: "Failed to fetch average rating" });
  }
});

export default router;