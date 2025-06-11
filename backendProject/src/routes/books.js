import express from "express";
import axios from "axios";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../db.js";

const router = express.Router();
const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = "YOUR_API_KEY_HERE"; // Replace with your Google Books API key

// Middleware to verify JWT and check admin role
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await pool.query("SELECT role FROM users WHERE user_id = $1", [decoded.id]);
    if (user.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// GET /books - Search featured books or filter by tags
router.get("/", async (req, res) => {
  const { q, tag } = req.query;

  try {
    if (!q && !tag) {
      // Return featured books
      const result = await pool.query(
        `SELECT b.*, ARRAY_AGG(t.name) as tags
         FROM books b
         LEFT JOIN book_tags bt ON b.id = bt.book_id
         LEFT JOIN tags t ON bt.tag_id = t.tag_id
         WHERE b.featured = TRUE
         GROUP BY b.id`
      );
      return res.json({ items: result.rows });
    }

    if (tag) {
      // Filter by tag
      const result = await pool.query(
        `SELECT b.*, ARRAY_AGG(t.name) as tags
         FROM books b
         JOIN book_tags bt ON b.id = bt.book_id
         JOIN tags t ON bt.tag_id = t.tag_id
         WHERE t.name = $1 AND b.featured = TRUE
         GROUP BY b.id`,
        [tag]
      );
      return res.json({ items: result.rows });
    }

    // Search Google Books API
    const response = await axios.get(
      `${GOOGLE_BOOKS_API_URL}?q=${encodeURIComponent(q)}&key=${GOOGLE_BOOKS_API_KEY}`
    );

    // Store featured books in database
    const books = response.data.items || [];
    for (const book of books) {
      const google_book_id = book.id;
      const title = book.volumeInfo.title || "Unknown Title";
      const authors = book.volumeInfo.authors || [];
      const isbn = book.volumeInfo.industryIdentifiers?.find(id => id.type === "ISBN_13")?.identifier || null;

      await pool.query(
        "INSERT INTO books (google_book_id, title, authors, isbn, featured) VALUES ($1, $2, $3, $4, FALSE) ON CONFLICT (google_book_id) DO NOTHING",
        [google_book_id, title, authors, isbn]
      );
    }

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching books:", error.message);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// POST /books/:google_book_id/feature - Mark book as featured (admin only)
router.post("/:google_book_id/feature", verifyAdmin, async (req, res) => {
  const { google_book_id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE books SET featured = TRUE WHERE google_book_id = $1 RETURNING *",
      [google_book_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book marked as featured", book: result.rows[0] });
  } catch (error) {
    console.error("Error marking book as featured:", error);
    res.status(500).json({ error: "Failed to mark book as featured" });
  }
});

// POST /books/:google_book_id/tags - Add tag to book (admin only)
router.post("/:google_book_id/tags", verifyAdmin, async (req, res) => {
  const { google_book_id } = req.params;
  const { tag_name } = req.body;

  if (!tag_name) {
    return res.status(400).json({ error: "Tag name required" });
  }

  try {
    // Ensure book exists
    const bookResult = await pool.query(
      "SELECT id FROM books WHERE google_book_id = $1",
      [google_book_id]
    );
    if (bookResult.rowCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    const book_id = bookResult.rows[0].id;

    // Insert or get tag
    const tagResult = await pool.query(
      "INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING tag_id",
      [tag_name]
    );
    const tag_id = tagResult.rows[0]?.tag_id || (await pool.query("SELECT tag_id FROM tags WHERE name = $1", [tag_name])).rows[0].tag_id;

    // Link tag to book
    await pool.query(
      "INSERT INTO book_tags (book_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [book_id, tag_id]
    );

    res.json({ message: "Tag added to book" });
  } catch (error) {
    console.error("Error adding tag:", error);
    res.status(500).json({ error: "Failed to add tag" });
  }
});

// DELETE /books/:google_book_id/tags/:tag_name - Remove tag from book (admin only)
router.delete("/:google_book_id/tags/:tag_name", verifyAdmin, async (req, res) => {
  const { google_book_id, tag_name } = req.params;

  try {
    const bookResult = await pool.query(
      "SELECT id FROM books WHERE google_book_id = $1",
      [google_book_id]
    );
    if (bookResult.rowCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    const book_id = bookResult.rows[0].id;

    const tagResult = await pool.query(
      "SELECT tag_id FROM tags WHERE name = $1",
      [tag_name]
    );
    if (tagResult.rowCount === 0) {
      return res.status(404).json({ error: "Tag not found" });
    }
    const tag_id = tagResult.rows[0].tag_id;

    const result = await pool.query(
      "DELETE FROM book_tags WHERE book_id = $1 AND tag_id = $2",
      [book_id, tag_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Tag not associated with book" });
    }

    res.json({ message: "Tag removed from book" });
  } catch (error) {
    console.error("Error removing tag:", error);
    res.status(500).json({ error: "Failed to remove tag" });
  }
});

// POST /books - Create or update a book
router.post("/", async (req, res) => {
  const { google_book_id, title, authors, description, image_url } = req.body;

  if (!google_book_id || !title) {
    return res.status(400).json({ error: "Book ID and title are required" });
  }

  try {
    // First check if book exists
    const existingBook = await pool.query(
      "SELECT id FROM books WHERE google_book_id = $1",
      [google_book_id]
    );

    let result;
    if (existingBook.rowCount === 0) {
      // Create new book
      result = await pool.query(
        `INSERT INTO books (google_book_id, title, authors, description, image_url) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [google_book_id, title, authors, description, image_url]
      );
    } else {
      // Update existing book
      result = await pool.query(
        `UPDATE books 
         SET title = $2, authors = $3, description = $4, image_url = $5
         WHERE google_book_id = $1
         RETURNING *`,
        [google_book_id, title, authors, description, image_url]
      );
    }

    if (!result.rows[0]) {
      throw new Error("Failed to save book");
    }

    res.status(201).json({ book: result.rows[0] });
  } catch (error) {
    console.error("Error saving book:", error);
    res.status(500).json({ error: "Failed to save book" });
  }
});

export default router;