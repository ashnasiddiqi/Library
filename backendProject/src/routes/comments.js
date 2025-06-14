import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../db.js";

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const user = await pool.query("SELECT role FROM users WHERE user_id = $1", [req.user.id]);
    if (user.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /comments - Add a comment
router.post("/", verifyToken, async (req, res) => {
  const { google_book_id, comment } = req.body;
  console.log("Received comment request:", { google_book_id, comment, user_id: req.user.id });

  if (!google_book_id || !comment) {
    return res.status(400).json({ error: "Book ID and comment are required" });
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
      "INSERT INTO comments (book_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *",
      [book_id, req.user.id, comment]
    );
    console.log("Comment insert result:", result.rows);

    if (!result.rows[0]) {
      throw new Error("Failed to save comment");
    }

    res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// GET /comments/:google_book_id - Get all comments for a book
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
      `SELECT c.comment_id, c.comment, c.created_at, c.updated_at, c.is_edited, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.book_id = $1
       ORDER BY c.created_at DESC`,
      [book_id]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// PUT /comments/:comment_id - Edit a comment (user or admin)
router.put("/:comment_id", verifyToken, async (req, res) => {
  const { comment_id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return res.status(400).json({ error: "Comment text required" });
  }

  try {
    const commentResult = await pool.query(
      "SELECT user_id FROM comments WHERE comment_id = $1",
      [comment_id]
    );
    if (commentResult.rowCount === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const userRole = (await pool.query("SELECT role FROM users WHERE user_id = $1", [req.user.id])).rows[0].role;
    if (commentResult.rows[0].user_id !== req.user.id && userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized to edit this comment" });
    }

    const result = await pool.query(
      "UPDATE comments SET comment = $1, updated_at = CURRENT_TIMESTAMP, is_edited = TRUE WHERE comment_id = $2 RETURNING *",
      [comment, comment_id]
    );

    res.json({ message: "Comment updated successfully", comment: result.rows[0] });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ error: "Failed to edit comment" });
  }
});

// DELETE /comments/:comment_id - Delete a comment (admin only)
router.delete("/:comment_id", verifyToken, verifyAdmin, async (req, res) => {
  const { comment_id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM comments WHERE comment_id = $1 RETURNING *",
      [comment_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// GET /comments/user - Get comments based on user role
router.get("/user/comments", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = (await pool.query("SELECT role FROM users WHERE user_id = $1", [userId])).rows[0].role;

    let query;
    let queryParams;

    if (userRole === "admin") {
      // Fetch all comments with book and user details
      query = `
        SELECT c.comment_id, c.comment, c.created_at, c.updated_at, c.is_edited, 
               u.username, b.google_book_id, b.title
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        JOIN books b ON c.book_id = b.id
        ORDER BY c.created_at DESC
      `;
      queryParams = [];
    } else {
      // Fetch comments for the logged-in user
      query = `
        SELECT c.comment_id, c.comment, c.created_at, c.updated_at, c.is_edited, 
               u.username, b.google_book_id, b.title
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        JOIN books b ON c.book_id = b.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
      `;
      queryParams = [userId];
    }

    const result = await pool.query(query, queryParams);
    res.json({ comments: result.rows });
  } catch (error) {
    console.error("Error fetching user comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

export default router;