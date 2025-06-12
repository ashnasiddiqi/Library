/* ----------  src/components/BookInteraction.tsx  ---------- */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import StarRating from "./StarRating";
import { User } from "../types";

/* ─── local types ─── */
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
interface Props {
  user: User | null;
}

/* ======================================================================= */
const BookInteraction: React.FC<Props> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ---------- state ---------- */
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [err, setErr] = useState("");

  /* ---------- first load ---------- */
  useEffect(() => {
    (async () => {
      try {
        /* 1 ◾ Google Books  */
        const gRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${id}`,
          { credentials: "omit", mode: "cors" }
        );
        if (!gRes.ok) throw new Error("google-fail");
        setBook(await gRes.json());
      } catch {
        setErr("Couldn’t load book data – try again later.");
        return;
      }

      /* 2 ◾ comments + rating (non-fatal) */
      try {
        const { data } = await api.get(`/api/comments/${id}`);
        setComments(data.comments);
      } catch {
        /* ignore */
      }

      try {
        const { data } = await api.get(`/api/ratings/${id}/average`);
        setAvg(data.average_rating);
        setCount(data.rating_count);
      } catch {
        /* ignore */
      }
    })();
  }, [id]);

  /* ---------- helpers ---------- */
  const ensureBook = () =>
    api.post("/api/books", {
      google_book_id: id,
      title: book?.volumeInfo.title ?? "Unknown",
      authors: book?.volumeInfo.authors ?? [],
      description: book?.volumeInfo.description ?? "",
      image_url: book?.volumeInfo.imageLinks?.thumbnail ?? "",
    });

  /* ---------- rating ---------- */
  const handleRate = async (value: number) => {
    if (!user) return setErr("Login to rate");
    setErr("");

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
    } catch (e: any) {
      setErr(e.response?.data?.error || "Could not save rating");
    }
  };

  /* ---------- comment ---------- */
  const handleAddComment = async () => {
    if (!user) return setErr("Login to comment");
    if (!comment.trim()) return setErr("Comment can’t be empty");
    setErr("");

    try {
      await ensureBook();
      const { data } = await api.post(
        "/api/comments",
        { google_book_id: id, comment: comment.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments([data.comment, ...comments]);
      setComment("");
    } catch (e: any) {
      setErr(e.response?.data?.error || "Couldn’t add comment");
    }
  };

  /* ---------- render ---------- */
  if (err)
    return (
      <div style={{ padding: 32 }}>
        <button onClick={() => navigate(-1)} style={btnBack}>
          ← Back
        </button>
        <p style={{ color: "red" }}>{err}</p>
      </div>
    );

  if (!book) return <p style={{ padding: 32 }}>Loading…</p>;

  return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate(-1)} style={btnBack}>
        ← Back
      </button>

      {/* ── “card” wrapper gives a subtle darker panel ── */}
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>{book.volumeInfo.title}</h1>

        {/* cover + description */}
        <section style={sectionFlex}>
          <div style={coverWrap}>
            <img
              src={book.volumeInfo.imageLinks?.thumbnail}
              alt={book.volumeInfo.title}
              style={coverImg}
            />
          </div>

          <div style={{ lineHeight: 1.5 }}>
            <p
              dangerouslySetInnerHTML={{
                __html: book.volumeInfo.description ?? "No description",
              }}
            />
          </div>
        </section>

        {/* rating */}
        <h2>Rate this book</h2>
        {!user && (
          <p style={{ marginTop: -8 }}>
            Please <Link to="/">login</Link> to rate
          </p>
        )}
        <StarRating onRatingSelect={handleRate} />
        <p>
          Average {avg} ★ ({count})
        </p>
        {rating > 0 && <p>Your rating: {rating} ★</p>}

        {/* comments */}
        <h2>Comments</h2>
        {!user && (
          <p style={{ marginTop: -8 }}>
            Please <Link to="/">login</Link> to comment
          </p>
        )}
        <textarea
          rows={3}
          style={textArea}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!user}
        />
        <br />
        <button onClick={handleAddComment} disabled={!user} style={btnMain}>
          Add
        </button>

        <ul style={{ listStyle: "none", padding: 0, marginTop: 24 }}>
          {comments.map((c) => (
            <li key={c.comment_id} style={commentItem}>
              <p>{c.comment}</p>
              <small>
                {c.username} – {new Date(c.created_at).toLocaleDateString()}
                {c.is_edited && " (edited)"}
              </small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/* ---------- inline styles ---------- */
const card: React.CSSProperties = {
  background: "#141414",
  borderRadius: 12,
  padding: 24,
  boxShadow: "0 0 20px #00000055",
};

const btnBack: React.CSSProperties = {
  marginBottom: 16,
  padding: "4px 12px",
  border: "none",
  borderRadius: 4,
  background: "#3498db",
  color: "#fff",
  cursor: "pointer",
};
const btnMain: React.CSSProperties = {
  ...btnBack,
  marginTop: 8,
};

const sectionFlex: React.CSSProperties = {
  display: "flex",
  gap: 32,
  flexWrap: "wrap",
};

const coverWrap: React.CSSProperties = {
  width: 200,
  height: 300,
  flexShrink: 0,
  background: "#111",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
};

const coverImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "contain",
};

const textArea: React.CSSProperties = {
  width: "100%",
  padding: 8,
  fontSize: 16,
  borderRadius: 4,
  border: "1px solid #555",
  background: "#1e1e1e",
  color: "#fff",
};

const commentItem: React.CSSProperties = {
  borderBottom: "1px solid #444",
  padding: "12px 0",
  lineHeight: 1.4,
};

export default BookInteraction;
