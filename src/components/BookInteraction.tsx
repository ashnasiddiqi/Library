/* ---------- src/components/BookInteraction.tsx ---------- */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import StarRating from "./StarRating";
import { User } from "../types";

/* ---------- types ---------- */
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

/* ======================================================================= */
const BookInteraction: React.FC<Props> = ({ user }) => {
  const { id }        = useParams<{ id: string }>();
  const   navigate    = useNavigate();

  /* ---------- state ---------- */
  const [book,      setBook]      = useState<Book | null>(null);
  const [comment,   setComment]   = useState("");
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [rating,    setRating]    = useState(0);
  const [avg,       setAvg]       = useState(0);
  const [count,     setCount]     = useState(0);

  const [bookErr, setBookErr] = useState("");   // 🆕 only Google-Books failures
  const [auxErr,  setAuxErr]  = useState("");   // 🆕 comments / ratings etc.

  /* ---------- first load ---------- */
  useEffect(() => {
    (async () => {
      try {
        /* 1 ◾ Google Books */
        const g = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        if (!g.ok) throw new Error("google-fail");
        setBook(await g.json());
      } catch {
        setBookErr("Couldn’t load book data – try again later.");
        return;                       // nothing else to do
      }

      /* 2 ◾ comments + rating (errors non-blocking) */
      try {
        const { data } = await api.get(`/api/comments/${id}`);
        setComments(data.comments);
      } catch { /* silently ignore or… */ }

      try {
        const { data } = await api.get(`/api/ratings/${id}/average`);
        setAvg(data.average_rating);
        setCount(data.rating_count);
      } catch { /* silently ignore or… */ }
    })();
  }, [id]);

  /* ---------- helpers ---------- */
  const ensureBook = () =>
    api.post("/api/books", {
      google_book_id: id,
      title:       book?.volumeInfo.title ?? "Unknown",
      authors:     book?.volumeInfo.authors ?? [],
      description: book?.volumeInfo.description ?? "",
      image_url:   book?.volumeInfo.imageLinks?.thumbnail ?? "",
    });

  /* ---------- rating ---------- */
  const handleRate = async (value: number) => {
    if (!user)        return setAuxErr("Login to rate");
    setAuxErr("");

    try {
      await ensureBook();
      await api.post(
        "/api/ratings",
        { google_book_id: id, rating: value },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setRating(value);

      const { data } = await api.get(`/api/ratings/${id}/average`);
      setAvg(data.average_rating);
      setCount(data.rating_count);
    } catch (e:any) {
      setAuxErr(e.response?.data?.error || "Could not save rating");
    }
  };

  /* ---------- comment ---------- */
  const handleAddComment = async () => {
    if (!user)             return setAuxErr("Login to comment");
    if (!comment.trim())   return setAuxErr("Comment can’t be empty");
    setAuxErr("");

    try {
      await ensureBook();
      const { data } = await api.post(
        "/api/comments",
        { google_book_id: id, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments([data.comment, ...comments]);
      setComment("");
    } catch (e:any) {
      setAuxErr(e.response?.data?.error || "Couldn’t add comment");
    }
  };

  /* ---------- render ---------- */
  if (bookErr)                                           // 🆕
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => navigate(-1)} style={btnBack}>← Back</button>
        <p style={{ color: "red" }}>{bookErr}</p>
      </div>
    );

  if (!book) return <p style={{ padding: 32 }}>Loading…</p>;

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate(-1)} style={btnBack}>← Back</button>

      <h1>{book.volumeInfo.title}</h1>

      {/* optional auxiliary error banner */}
      {auxErr && <p style={{ color: "orange" }}>{auxErr}</p>}          {/* 🆕 */}

      {/* description + cover */}
      <section style={{ display: "flex", gap: 32 }}>
        <img
          src={book.volumeInfo.imageLinks?.thumbnail}
          alt={book.volumeInfo.title}
          style={{ width: 180, borderRadius: 8 }}
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
        value={comment}
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

/* ---------- tiny style helper ---------- */
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
