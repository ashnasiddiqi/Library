import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    imageLinks?: {
      thumbnail: string;
    };
  };
}

const BookInteraction = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  useEffect(() => {
    const fetchBook = async () => {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes/${id}`
      );
      setBook(response.data);
    };

    fetchBook();
  }, [id]);

  const handleAddComment = () => {
    if (comment.trim()) {
      setComments([...comments, comment]);
      setComment("");
    }
  };

  if (!book) return <p>Loading book...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>{book.volumeInfo.title}</h1>
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* Left: Book Cover */}
        <img
          src={book.volumeInfo.imageLinks?.thumbnail}
          alt={book.volumeInfo.title}
          style={{
            width: "200px",
            borderRadius: "8px",
            boxShadow: "0 0 10px #00000055",
          }}
        />

        {/* Right: Comments Section */}
        <div style={{ flex: 1 }}>
          <h2>Comments</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your comment here..."
            rows={4}
            style={{
              width: "100%",
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
            }}
          />
          <br />
          <button
            onClick={handleAddComment}
            style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}
          >
            Add Comment
          </button>

          <h3 style={{ marginTop: "1.5rem" }}>All Comments</h3>
          <ul>
            {comments.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BookInteraction;
