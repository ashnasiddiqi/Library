/*  src/components/BookInteraction.tsx  */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";           // ✅ shared axios instance
import StarRating from "./StarRating";
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
    imageLinks?: { thumbnail: string };
  };
}

interface BookInteractionProps {
  user: User | null;
}

const BookInteraction: React.FC<BookInteractionProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook]               = useState<Book | null>(null);
  const [comment, setComment]         = useState("");
  const [comments, setComments]       = useState<Comment[]>([]);
  const [rating, setRating]           = useState(0);
  const [averageRating, setAverage]   = useState(0);
  const [ratingCount, setRCount]      = useState(0);
  const [error, setError]             = useState("");

  /* ────────────────────────────────────────────────────────── */
  /* fetch Google Books data + comments + ratings              */
  /* ────────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        /* 1. Google Books info */
        const { data: gBook } = await api.get(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        setBook(gBook);

        /* 2. Comments                               */
        try {
          const { data } = await api.get(`/api/comments/${id}`);
          setComments(data.comments);
        } catch {
          setComments([]);
        }

        /* 3. Average rating                         */
        try {
          const { data } = await api.get(`/api/ratings/${id}/average`);
          setAverage(data.average_rating);
          setRCount(data.rating_count);
        } catch {
          setAverage(0);
          setRCount(0);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load book data. Please try again later.");
      }
    })();
  }, [id]);

  /* ────────────────────────────────────────────────────────── */
  /* RATE a book                                               */
  /* ────────────────────────────────────────────────────────── */
  const handleRating = async (value: number) => {
    if (!user) return mustLogin("rate this book");

    try {
      const token = localStorage.getItem("token")!;
      /* ensure book exists in DB */
      await api.post("/api/books", toDBBookPayload());

      /* save rating */
      await api.post(
        "/api/ratings",
        { google_book_id: id, rating: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRating(value);

      /* refresh averages */
      const { data } = await api.get(`/api/ratings/${id}/average`);
      setAverage(data.average_rating);
      setRCount(data.rating_count);
      setError("");
    } catch (err: any) {
      handleAxiosError(err, "rating");
    }
  };

  /* ────────────────────────────────────────────────────────── */
  /* ADD a comment                                             */
  /* ────────────────────────────────────────────────────────── */
  const handleAddComment = async () => {
    if (!user) return mustLogin("add a comment");
    if (!comment.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("token")!;
      await api.post("/api/books", toDBBookPayload());

      const { data } = await api.post(
        "/api/comments",
        { google_book_id: id, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([data.comment, ...comments]);
      setComment("");
      setError("");
    } catch (err: any) {
      handleAxiosError(err, "comment");
    }
  };

  /* ────────────────────────────────────────────────────────── */
  /* helpers                                                   */
  /* ────────────────────────────────────────────────────────── */
  const mustLogin = (action: string) => {
    setError(`Please login to ${action}`);
    navigate("/");
  };

  const handleAxiosError = (err: any, what: string) => {
    console.error(`Error ${what}:`, err.response || err);
    if (err.response?.status === 401) mustLogin(what);
    else setError(err.response?.data?.error || `Failed to save ${what}`);
  };

  const toDBBookPayload = () => ({
    google_book_id: id,
    title: book?.volumeInfo.title || "Unknown Title",
    authors: book?.volumeInfo.authors || [],
    description: book?.volumeInfo.description || "",
    image_url: book?.volumeInfo.imageLinks?.thumbnail || "",
  });

  /* ────────────────────────────────────────────────────────── */
  /* RENDER                                                    */
  /* ────────────────────────────────────────────────────────── */
  if (!book)
    return (
      <div style={{ padding: "2rem" }}>
        <p style={{ textAlign: "center" }}>Loading book…</p>
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      <button onClick={() => navigate(-1)} style={backBtn}>
        ← Back to Books
      </button>

      <h1>{book.volumeInfo.title}</h1>

      <div style={{ display: "flex", gap: "2rem" }}>
        {book.volumeInfo.imageLinks?.thumbnail && (
          <img
            src={book.volumeInfo.imageLinks.thumbnail}
            alt={book.volumeInfo.title}
            style={{ width: 200, borderRadius: 8 }}
          />
        )}

        <div style={{ flex: 1 }}>
          <h2>Description</h2>
          <p
            dangerouslySetInnerHTML={{
              __html: book.volumeInfo.description || "No description.",
            }}
          />

          <h2>Rate this book</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}

          <StarRating onRatingSelect={handleRating} />
          <p>
            Average: {averageRating} ⭐ ({ratingCount} ratings)
          </p>
          {rating > 0 && <p>Your rating: {rating} ⭐</p>}

          <h2>Comments</h2>
          <textarea
            disabled={!user}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              user ? "Write your comment…" : "Please login to comment"
            }
            rows={4}
            style={{ width: "100%", opacity: user ? 1 : 0.6 }}
          />
          <br />
          <button
            disabled={!user}
            onClick={handleAddComment}
            style={{ marginTop: 8, cursor: user ? "pointer" : "not-allowed" }}
          >
            Add comment
          </button>

          <h3 style={{ marginTop: 24 }}>All comments</h3>
          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            <ul style={{ padding: 0 }}>
              {comments.map((c) => (
                <li key={c.comment_id} style={{ marginBottom: 16 }}>
                  <p style={{ margin: 0 }}>{c.comment}</p>
                  <small>
                    by {c.username} –{" "}
                    {new Date(c.created_at).toLocaleDateString()}
                    {c.is_edited && " (edited)"}
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

/* small inline style */
const backBtn: React.CSSProperties = {
  marginBottom: "1rem",
  padding: "0.5rem 1rem",
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
};

export default BookInteraction;
