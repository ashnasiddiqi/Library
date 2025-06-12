/* ------------------  src/components/BookInteraction.tsx  ------------------ */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";          // ⬅️ plain axios (no credentials)
import { api } from "../api";       // ⬅️ your shared instance for *backend* calls
import StarRating from "./StarRating";
import { User } from "../types";

/* ---------- Types ---------- */
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
interface BookInteractionProps { user: User | null }

/* ======================================================================== */
const BookInteraction: React.FC<BookInteractionProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();

  /* ---------- State ---------- */
  const [book,          setBook]          = useState<Book | null>(null);
  const [comment,       setComment]       = useState("");
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [rating,        setRating]        = useState(0);
  const [average,       setAverage]       = useState(0);
  const [ratingCount,   setRatingCount]   = useState(0);
  const [error,         setError]         = useState("");

  /* ---------- Initial load ---------- */
  useEffect(() => {
    (async () => {
      try {
        /* 1 ─ Google Books  (no credentials!) */
        const { data } = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        setBook(data);

        /* 2 ─ comments */
        const c = await api.get(`/api/comments/${id}`);
        setComments(c.data.comments);

        /* 3 ─ ratings */
        const r = await api.get(`/api/ratings/${id}/average`);
        setAverage(r.data.average_rating);
        setRatingCount(r.data.rating_count);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load data. Please try again later.");
      }
    })();
  }, [id]);

  /* ---------- Helpers ---------- */
  const ensureBookExists = () =>
    api.post("/api/books", {
      google_book_id: id,
      title:        book?.volumeInfo.title             ?? "Unknown Title",
      authors:      book?.volumeInfo.authors           ?? [],
      description:  book?.volumeInfo.description       ?? "",
      image_url:    book?.volumeInfo.imageLinks?.thumbnail ?? ""
    });

  /* ---------- Rating ---------- */
  const handleRating = async (value: number) => {
    if (!user)        return setError("Please login to rate this book");
    if (!book)        return;

    try {
      await ensureBookExists();
      await api.post(
        "/api/ratings",
        { google_book_id: id, rating: value },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setRating(value);
      const { data } = await api.get(`/api/ratings/${id}/average`);
      setAverage(data.average_rating);
      setRatingCount(data.rating_count);
      setError("");
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to save rating");
    }
  };

  /* ---------- Comment ---------- */
  const handleAddComment = async () => {
    if (!user)               return setError("Please login to comment");
    if (!comment.trim())     return setError("Comment cannot be empty");
    if (!book)               return;

    try {
      await ensureBookExists();
      const { data } = await api.post(
        "/api/comments",
        { google_book_id: id, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments([data.comment, ...comments]);
      setComment("");
      setError("");
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to add comment");
    }
  };

  /* ---------- Render ---------- */
  if (!book)
    return (
      <div style={{ padding: "2rem" }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
          ← Back
        </button>
        <p>Loading book…</p>
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem" }}>
        ← Back
      </button>

      <h1>{book.volumeInfo.title}</h1>

      <div style={{ display: "flex", gap: "2rem" }}>
        {book.volumeInfo.imageLinks?.thumbnail && (
          <img
            src={book.volumeInfo.imageLinks.thumbnail}
            alt={book.volumeInfo.title}
            style={{ width: 200 }}
          />
        )}

        <div style={{ flex: 1 }}>
          <h2>Description</h2>
          <p
            dangerouslySetInnerHTML={{
              __html: book.volumeInfo.description ?? "No description",
            }}
          />

          {/* --- Rating --- */}
          <h2>Rate</h2>
          <StarRating onRatingSelect={handleRating} />
          <p>
            Avg&nbsp;{average} ★ ({ratingCount})
          </p>
          {rating > 0 && <p>Your rating: {rating} ★</p>}

          {/* --- Comments --- */}
          <h2>Comments</h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
            disabled={!user}
          />
          <button onClick={handleAddComment} disabled={!user}>
            Add Comment
          </button>

          <ul style={{ listStyle: "none", padding: 0 }}>
            {comments.map((c) => (
              <li key={c.comment_id} style={{ padding: "0.5rem 0" }}>
                <p>{c.comment}</p>
                <small>
                  {c.username} – {new Date(c.created_at).toLocaleDateString()}
                  {c.is_edited && " (edited)"}
                </small>
              </li>
            ))}
          </ul>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default BookInteraction;
