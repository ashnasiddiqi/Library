import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import StarRating from "./StarRating";
import { Link } from "react-router-dom";
import { User } from "../types";

interface Comment {
  comment_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  username: string;
}

interface Book {
  id: string;
  volumeInfo: {
    title: string;
    description?: string;
    authors?: string[];
    imageLinks?: {
      thumbnail: string;
    };
  };
}

interface BookInteractionProps {
  user: User | null;
}

const BookInteraction: React.FC<BookInteractionProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [rating, setRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        // First, get the book from Google Books API
        const bookResponse = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        const bookData = bookResponse.data;
        setBook(bookData);

        // Then try to get comments and ratings
        try {
          const commentsResponse = await axios.get(
            `http://localhost:3000/api/comments/${id}`
          );
          setComments(commentsResponse.data.comments);
        } catch (error) {
          console.error("Error fetching comments:", error);
          setComments([]);
        }

        try {
          const ratingResponse = await axios.get(
            `http://localhost:3000/api/ratings/${id}/average`
          );
          setAverageRating(ratingResponse.data.average_rating);
          setRatingCount(ratingResponse.data.rating_count);
        } catch (error) {
          console.error("Error fetching ratings:", error);
          setAverageRating(0);
          setRatingCount(0);
        }
      } catch (error) {
        console.error("Error fetching book data:", error);
        setError("Failed to load book data. Please try again later.");
      }
    };

    fetchBookData();
  }, [id]);

  const handleRating = async (value: number) => {
    if (!user) {
      setError("Please login to rate this book");
      navigate("/");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to rate this book");
        navigate("/");
        return;
      }

      // First ensure the book exists in our database
      const bookResponse = await axios.post(
        "http://localhost:3000/api/books",
        {
          google_book_id: id,
          title: book?.volumeInfo.title || "Unknown Title",
          authors: book?.volumeInfo.authors || [],
          description: book?.volumeInfo.description || "",
          image_url: book?.volumeInfo.imageLinks?.thumbnail || ""
        }
      );

      if (!bookResponse.data.book) {
        throw new Error("Failed to save book");
      }

      // Then save the rating
      const response = await axios.post(
        "http://localhost:3000/api/ratings",
        {
          google_book_id: id,
          rating: value
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.rating) {
        setRating(value);
        // Refresh average rating
        const ratingResponse = await axios.get(
          `http://localhost:3000/api/ratings/${id}/average`
        );
        setAverageRating(ratingResponse.data.average_rating);
        setRatingCount(ratingResponse.data.rating_count);
        setError("");
      }
    } catch (error: any) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      if (error.response?.status === 401) {
        setError("Please login to rate this book");
        navigate("/");
      } else {
        setError(error.response?.data?.error || "Failed to save rating");
      }
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      setError("Please login to add a comment");
      navigate("/");
      return;
    }

    if (!comment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      // First ensure the book exists in our database
      const bookResponse = await axios.post(
        "http://localhost:3000/api/books",
        {
          google_book_id: id,
          title: book?.volumeInfo.title || "Unknown Title",
          authors: book?.volumeInfo.authors || [],
          description: book?.volumeInfo.description || "",
          image_url: book?.volumeInfo.imageLinks?.thumbnail || ""
        }
      );

      if (!bookResponse.data.book) {
        throw new Error("Failed to save book");
      }

      // Then save the comment
      const response = await axios.post(
        "http://localhost:3000/api/comments",
        {
          google_book_id: id,
          comment: comment.trim()
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      if (response.data.comment) {
        setComments([response.data.comment, ...comments]);
        setComment("");
        setError("");
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response?.status === 401) {
        setError("Please login to add a comment");
        navigate("/");
      } else {
        setError(error.response?.data?.error || "Failed to add comment");
      }
    }
  };

  if (!book) {
    return (
      <div style={{ padding: "2rem" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginBottom: "2rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ← Back to Books
        </button>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#666",
            textAlign: "center",
            marginTop: "2rem",
          }}
        >
          Loading book...
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "2rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        ← Back to Books
      </button>
      <h1 style={{ marginBottom: "1rem" }}>{book.volumeInfo.title}</h1>
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        <img
          src={book.volumeInfo.imageLinks?.thumbnail}
          alt={book.volumeInfo.title}
          style={{
            width: "200px",
            borderRadius: "8px",
            boxShadow: "0 0 10px #00000055",
          }}
        />

        <div style={{ flex: 1 }}>
          <h2>Description</h2>
          <p
            style={{ marginBottom: "2rem" }}
            dangerouslySetInnerHTML={{
              __html: book.volumeInfo.description || "Description not found",
            }}
          ></p>

          <h2>Rate This Book</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!user && (
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              Please <Link to="/">login</Link> to rate this book
            </p>
          )}
          <StarRating onRatingSelect={handleRating} />
          <p>
            Average Rating: {averageRating} stars ({ratingCount} ratings)
          </p>
          {rating > 0 && (
            <p>
              Your rating: {rating} star{rating !== 1 ? "s" : ""}
            </p>
          )}

          <h2>Comments</h2>
          {!user && (
            <p style={{ color: "#666", marginBottom: "1rem" }}>
              Please <Link to="/">login</Link> to add a comment
            </p>
          )}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={user ? "Write your comment here..." : "Please login to comment"}
            rows={4}
            style={{
              width: "100%",
              padding: "0.5rem",
              fontSize: "1rem",
              borderRadius: "4px",
              opacity: user ? 1 : 0.7,
            }}
            disabled={!user}
          />
          <br />
          <button
            onClick={handleAddComment}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              opacity: user ? 1 : 0.7,
              cursor: user ? "pointer" : "not-allowed",
            }}
            disabled={!user}
          >
            Add Comment
          </button>

          <h3 style={{ marginTop: "1.5rem" }}>All Comments</h3>
          {comments.length === 0 ? (
            <p>No comments yet. Be the first to comment!</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {comments.map((comment) => (
                <li
                  key={comment.comment_id}
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "1rem 0",
                  }}
                >
                  <p style={{ margin: 0 }}>{comment.comment}</p>
                  <small style={{ color: "#666" }}>
                    By {comment.username} on{" "}
                    {new Date(comment.created_at).toLocaleDateString()}
                    {comment.is_edited && " (edited)"}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookInteraction;
