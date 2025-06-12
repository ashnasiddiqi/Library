/* ---------  src/components/BookInteraction.tsx  --------- */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";         // backend axios
import StarRating from "./StarRating";
import { User } from "../types";

/* ────────────────── types ────────────────── */
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
interface Props { user: User | null }

/* ────────────────── component ────────────────── */
const BookInteraction: React.FC<Props> = ({ user }) => {
  const { id }              = useParams<{ id: string }>();
  const   navigate          = useNavigate();

  const [book,  setBook]           = useState<Book | null>(null);
  const [commentText, setComment]  = useState("");
  const [comments,     setComments]= useState<Comment[]>([]);
  const [rating,       setRating]  = useState(0);
  const [avg,  setAvg]             = useState(0);
  const [count,setCount]           = useState(0);
  const [err,  setErr]             = useState("");

  /* ── first load ── */
  useEffect(() => {
    (async () => {
      try {
        /* 1 ◾ Google Books (no credentials!) */
        const gRes   = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        const gBook  = await gRes.json();
        setBook(gBook);

        /* 2 ◾ our backend: comments + rating */
        const cRes = await api.get(`/api/comments/${id}`);
        setComments(cRes.data.comments);

        const rRes = await api.get(`/api/ratings/${id}/average`);
        setAvg(rRes.data.average_rating);
        setCount(rRes.data.rating_count);
      } catch (e:any) {
        console.error(e);
        setErr("Couldn’t load book data – try again in a minute.");
      }
    })();
  }, [id]);

  /* ───────────────── helpers ───────────────── */
  const ensureBook = () =>
    api.post("/api/books", {
      google_book_id: id,
      title:       book?.volumeInfo.title        ?? "Unknown",
      authors:     book?.volumeInfo.authors      ?? [],
      description: book?.volumeInfo.description  ?? "",
      image_url:   book?.volumeInfo.imageLinks?.thumbnail ?? "",
    });

  /* ───────────────── rating ───────────────── */
  const handleRate = async (value: number) => {
    if (!user) return setErr("Login to rate");

    try {
      await ensureBook();
      await api.post(
        "/api/ratings",
        { google_book_id: id, rating: value },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setRating(value);

      /* refresh average */
      const { data } = await api.get(`/api/ratings/${id}/average`);
      setAvg(data.average_rating);
      setCount(data.rating_count);
    } catch (e:any) {
      setErr(e.response?.data?.error || "Could not save rating");
    }
  };

  /* ───────────────── comment ───────────────── */
  const handleAddComment = async () => {
    if (!user)               return setErr("Login to comment");
    if (!commentText.trim()) return setErr("Comment can’t be empty");

    try {
      await ensureBook();
      const { data } = await api.post(
        "/api/comments",
        { google_book_id: id, comment: commentText.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments([data.comment, ...comments]);
      setComment("");
    } catch (e:any) {
      setErr(e.response?.data?.error || "Couldn’t add comment");
    }
  };

  /* ───────────────── render ───────────────── */
  if (!book) return <p style={{ padding: 32 }}>Loading book…</p>;

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate(-1)} style={btnBack}>← Back</button>

      <h1>{book.volumeInfo.title}</h1>
      {err && <p style={{ color: "red" }}>{err}</p>}

      {/* description + cover */}
      <section style={{ display: "flex", gap: 32 }}>
        <img
          src={book.volumeInfo.imageLinks?.thumbnail}
          alt={book.volumeInfo.title}
          style={{ width: 200, borderRadius: 8 }}
        />
        <p
          dangerouslySetInnerHTML={{
            __html: book.volumeInfo.description ?? "No description",
          }}
        />
      </section>

      {/* rating */}
      <h2>Rate this book</h2>
      {!user && <p>Please <Link to="/">login</Link> to rate</p>}
      <StarRating onRatingSelect={handleRate} />
      <p>Average {avg} ★ ({count})</p>
      {rating > 0 && <p>Your rating: {rating} ★</p>}

      {/* comments */}
      <h2>Comments</h2>
      {!user && <p>Please <Link to="/">login</Link> to comment</p>}
      <textarea
        rows={3}
        style={{ width: "100%", marginBottom: 8 }}
        value={commentText}
        onChange={e => setComment(e.target.value)}
        disabled={!user}
      />
      <br />
      <button onClick={handleAddComment} disabled={!user}>Add</button>

      <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
        {comments.map(c => (
          <li key={c.comment_id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
            <p>{c.comment}</p>
            <small>
              {c.username} – {new Date(c.created_at).toLocaleDateString()}
              {c.is_edited && " (edited)"}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- tiny style helpers ---------- */
const btnBack: React.CSSProperties = {
  marginBottom: 16,
  padding: "4px 10px",
  border: "none",
  borderRadius: 4,
  background: "#3498db",
  color: "#fff",
  cursor: "pointer",
};

export default BookInteraction;
