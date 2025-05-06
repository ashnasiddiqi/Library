// routes/books.js

import express from "express";
import axios from "axios";
import pool from "../db"; // Adjust the path to your db.js file

const router = express.Router();
const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

// GET all books (with Google Books API search)
router.get("/", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      // If no query, you might want to return books from your database or an empty array
      return res.json({ books: [] }); // Or fetch from your DB
    }
    const response = await axios.get(
      `<span class="math-inline">\{GOOGLE\_BOOKS\_API\_URL\}?q\=</span>{query}`
    );
    const apiBooks = response.data.items
      ? response.data.items.map((item) => ({
          title: item.volumeInfo.title,
          authors: item.volumeInfo.authors,
          isbn:
            item.volumeInfo.industryIdentifiers?.find(
              (identifier) => identifier.type === "ISBN_13"
            )?.identifier ||
            item.volumeInfo.industryIdentifiers?.find(
              (identifier) => identifier.type === "ISBN_10"
            )?.identifier,
          description: item.volumeInfo.description,
          thumbnail: item.volumeInfo.imageLinks?.thumbnail,
        }))
      : [];
    res.json({ books: apiBooks });
  } catch (error) {
    console.error("Error fetching books from Google Books API:", error);
    res.status(500).json({ error: "Failed to fetch books from the API" });
  }
});

// POST endpoint to rate a book
router.post("/rate", async (req, res) => {
  const { bookId, rating } = req.body;

  if (!bookId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Invalid book ID or rating." });
  }

  try {
    // Assuming you have a 'books' table with a column 'google_book_id'
    // and a 'rating' column. Adjust your query accordingly.
    const result = await pool.query(
      "UPDATE books SET rating = $1 WHERE google_book_id = $2",
      [rating, bookId]
    );

    if (result.rowCount > 0) {
      res.json({ message: "Rating saved successfully." });
    } else {
      res.status(404).json({ error: "Book not found." });
    }
  } catch (error) {
    console.error("Error saving rating:", error);
    res.status(500).json({ error: "Failed to save rating." });
  }
});

export default router;
