import express from "express";
import pool from "../db.js";

const router = express.Router();

// POST /ratings - Add a rating
router.post("/", async (req, res) => {
  const { user_id, google_book_id, rating } = req.body;

  if (!user_id || !google_book_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    // Ensure book exists
    const bookResult = await pool.query(
      "INSERT INTO books (google_book_id, title) VALUES ($1, $2) ON CONFLICT (google_book_id) DO NOTHING RETURNING id",
      [google_book_id, "Unknown Title"]
    );

    const book_id = bookResult.rows[0]?.id || (await pool.query("SELECT id FROM books WHERE google_book_id = $1", [google_book_id])).rows[0].id;

    const result = await pool.query(
      "INSERT INTO ratings (user_id, book_id, rating) VALUES ($1, $2, $3) ON CONFLICT (user_id, book_id) DO UPDATE SET rating = EXCLUDED.rating RETURNING *",
      [user_id, book_id, rating]
    );

    res.status(201).json({
      message: "Rating saved successfully",
      rating: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ error: "Failed to save rating" });
  }
});

// GET /ratings/:book_id - Get all ratings for a book
router.get("/:book_id", async (req, res) => {
  const { book_id } = req.params;

  try {
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

// GET /ratings/:book_id/average - Get average rating for a book
router.get("/:book_id/average", async (req, res) => {
  const { book_id } = req.params;

  try {
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