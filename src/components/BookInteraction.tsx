/* -----------------------------  BookInteraction.tsx  ---------------------------- */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";            // ← shared axios instance (baseURL = VITE_API_URL)
import StarRating from "./StarRating";
import { User } from "../types";

/* ─── Types ─────────────────────────────────────────────────────────────────────── */
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

/* ─── Component ─────────────────────────────────────────────────────────────────── */
const BookInteraction: React.FC<BookInteractionProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();

  /* state */
  const [book,          setBook]          = useState<Book | null>(null);
  const [commentText,   setCommentText]   = useState("");
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [rating,        setRating]        = useState(0);
  const [avgRating,     setAvgRating]     = useState(0);
  const [ratingCount,   setRatingCount]   = useState(0);
  const [error,         setError]         = useState("");

  /* ── first load ── */
  useEffect(() => {
    (async () => {
      try {
        /* 1️⃣ book info from Google */
        const { data: gBook } = await api.get(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        setBook(gBook);

        /* 2️⃣ comments */
        const { data: cRes } = await api.get(`/api/comments/${id}`);
        setComments(cRes.comments ?? []);

        /* 3️⃣ rating stats */
        const { data: rRes } = await api.get(`/api/ratings/${id}/average`);
        setAvgRating(rRes.average_rating);
        setRatingCount(rRes.rating_count);
      } catch (err) {
        console.error(err);
        setError("Failed to load data, please retry.");
      }
    })();
  }, [id]);

  /* helper – ensure book exists in Postgres */
  const ensureBook = () =>
    api.post("/api/books", {
      google_book_id: id,
      title:       book?.volumeInfo.title            ?? "Untitled",
      authors:     book?.volumeInfo.authors          ?? [],
      description: book?.volumeInfo.description      ?? "",
      image_url:   book?.volumeInfo.imageLinks?.thumbnail ?? "",
    });

  /* ── add / update rating ── */
  const handleRating = async (value: number) => {
    if (!user) return setError("Please login to rate.");

    try {
      await ensureBook();
      await api.post(
        "/api/ratings",
        { google_book_id: id, rating: value },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setRating(value);

      const { data } = await api.get(`/api/ratings/${id}/average`);
      setAvgRating(data.average_rating);
      setRatingCount(data.rating_count);
      setError("");
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || "Rating failed.");
    }
  };

  /* ── add comment ── */
  const addComment = async () => {
    if (!user)            return setError("Please login to comment.");
    if (!commentText.trim()) return setError("Empty comment.");

    try {
      await ensureBook();
      const { data } = await api.post(
        "/api/comments",
        { google_book_id: id, comment: commentText.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setComments([data.comment, ...comments]);
      setCommentText("");
      setError("");
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.error || "Add-comment failed.");
    }
  };

  /* ── render ── */
  if (!book) {
    return (
      <div style={{ padding: "2rem" }}>
        <button style={backBtn} onClick={() => navigate(-1)}>← Back</button>
        <p style={centerText}>Loading book…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <button style={backBtn} onClick={() => navigate(-1)}>← Back</button>

      <h1>{book.volumeInfo.title}</h1>
      <div style={{ display: "flex", gap: "2rem" }}>
        <img
          src={book.volumeInfo.imageLinks?.thumbnail}
          alt={book.volumeInfo.title}
          style={thumb}
        />

        <div style={{ flex: 1 }}>
          <h2>Description</h2>
          <p
            dangerouslySetInnerHTML={{
              __html: book.volumeInfo.description ?? "No description.",
            }}
          />

          <h2>Rate This Book</h2>
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!user && <p>Please <Link to="/">login</Link> to rate.</p>}

          <StarRating onRatingSelect={handleRating} />
          <p>
            Avg&nbsp;{avgRating} ⭐ ({ratingCount} rating{ratingCount !== 1 && "s"})
          </p>
          {rating > 0 && <p>Your rating: {rating} ⭐</p>}

          <h2>Comments</h2>
          {!user && <p>Please <Link to="/">login</Link> to comment.</p>}

          <textarea
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write your comment…"
            style={textArea}
            disabled={!user}
          />
          <br />
          <button onClick={addComment} disabled={!user}>
            Add Comment
          </button>

          <h3 style={{ marginTop: "1rem" }}>All Comments</h3>
          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {comments.map((c) => (
                <li key={c.comment_id} style={commentLi}>
                  <p>{c.comment}</p>
                  <small>
                    {c.username} – {new Date(c.created_at).toLocaleDateString()}
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

/* ─── inline styles ─────────────────────────────────────────────────────────────── */
const backBtn: React.CSSProperties = {
  marginBottom: "1rem",
  padding: "0.5rem 1rem",
  background: "#3498db",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
};
const centerText: React.CSSProperties = { textAlign: "center", marginTop: "2rem" };
const thumb: React.CSSProperties = {
  width: 200,
  borderRadius: 8,
  boxShadow: "0 0 10px #0005",
};
const textArea: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  fontSize: "1rem",
  borderRadius: 4,
};
const commentLi: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "1rem 0",
};

export default BookInteraction;
