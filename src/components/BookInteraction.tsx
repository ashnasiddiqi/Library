/* ------------------  src/components/BookInteraction.tsx  ------------------ */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";           // ✅ plain axios for Google
import { api } from "../api";        // ✅ credentialed instance for our API
import StarRating    from "./StarRating";
import { User }      from "../types";

/* ---------- Types ---------- */
interface Comment {
  comment_id:   string;
  comment:      string;
  created_at:   string;
  updated_at:   string;
  is_edited:    boolean;
  username:     string;
}
interface Book {
  id:         string;
  volumeInfo: {
    title:       string;
    description?:string;
    authors?:    string[];
    imageLinks?: { thumbnail: string };
  };
}
interface Props { user: User | null }
/* ======================================================================== */
const BookInteraction: React.FC<Props> = ({ user }) => {
  const { id }  = useParams<{ id: string }>();
  const nav     = useNavigate();

  const [book,          setBook]          = useState<Book | null>(null);
  const [comment,       setComment]       = useState("");
  const [comments,      setComments]      = useState<Comment[]>([]);
  const [rating,        setRating]        = useState(0);
  const [avgRating,     setAvgRating]     = useState(0);
  const [ratingCount,   setRatingCount]   = useState(0);
  const [error,         setError]         = useState("");

  /* ─────────────────── initial load ─────────────────── */
  useEffect(() => {
    (async () => {
      try {
        /* Google Books WITHOUT credentials */
        const { data: gBook } = await axios.get(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        setBook(gBook);

        /* Comments */
        const { data: cmt }  = await api.get(`/api/comments/${id}`);
        setComments(cmt.comments);

        /* Ratings */
        const { data: rt }   = await api.get(`/api/ratings/${id}/average`);
        setAvgRating(rt.average_rating);
        setRatingCount(rt.rating_count);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load book data.");
      }
    })();
  }, [id]);

  /* ─────────────────── helpers ─────────────────── */
  const ensureBook = () => api.post("/api/books", {
    google_book_id: id,
    title:        book?.volumeInfo.title ?? "Unknown",
    authors:      book?.volumeInfo.authors ?? [],
    description:  book?.volumeInfo.description ?? "",
    image_url:    book?.volumeInfo.imageLinks?.thumbnail ?? ""
  });

  /* ─────────────────── rating ─────────────────── */
  const handleRate = async (val: number) => {
    if (!user) return setError("Login to rate");          // guard
    try {
      await ensureBook();
      await api.post("/api/ratings",
        { google_book_id: id, rating: val },
        { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` }}
      );
      setRating(val);
      const { data } = await api.get(`/api/ratings/${id}/average`);
      setAvgRating(data.average_rating);
      setRatingCount(data.rating_count);
    } catch (e:any){ setError(e.response?.data?.error||"Rating failed"); }
  };

  /* ─────────────────── comment ─────────────────── */
  const addComment = async () => {
    if (!user)            return setError("Login to comment");
    if (!comment.trim())  return setError("Comment can’t be empty");
    try {
      await ensureBook();
      const { data } = await api.post("/api/comments",
        { google_book_id:id, comment:comment.trim() },
        { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` }}
      );
      setComments([data.comment, ...comments]);
      setComment("");
    } catch (e:any){ setError(e.response?.data?.error||"Comment failed"); }
  };

  /* ─────────────────── render ─────────────────── */
  if (!book) return (
    <div style={{padding:"2rem"}}>
      <button onClick={()=>nav(-1)} style={btnBack}>← Back</button>
      <p style={{textAlign:"center"}}>Loading book…</p>
    </div>
  );

  return (
    <div style={{padding:"2rem"}}>
      <button onClick={()=>nav(-1)} style={btnBack}>← Back</button>

      <h1>{book.volumeInfo.title}</h1>
      <div style={{display:"flex",gap:"2rem"}}>
        <img src={book.volumeInfo.imageLinks?.thumbnail} alt=""
             style={{width:200,borderRadius:8}} />

        <div style={{flex:1}}>
          {/* description */}
          <div dangerouslySetInnerHTML={{
            __html: book.volumeInfo.description ?? "No description"
          }}/>
          {/* rating */}
          <h3>Rate this book</h3>
          {error && <p style={{color:"red"}}>{error}</p>}
          <StarRating onRatingSelect={handleRate}/>
          <p>Average {avgRating} ⭐ ({ratingCount})</p>
          {rating>0 && <p>Your rating: {rating} ⭐</p>}
          {/* comments */}
          <h3>Comments</h3>
          <textarea rows={4} style={{width:"100%"}}
            disabled={!user}
            value={comment} onChange={e=>setComment(e.target.value)}
            placeholder={user?"Write a comment…":"Login to comment"}
          />
          <button onClick={addComment} disabled={!user}>Add</button>

          <ul style={{listStyle:"none",padding:0}}>
            {comments.map(c=>(
              <li key={c.comment_id} style={{borderBottom:"1px solid #eee",padding:"1rem 0"}}>
                <p>{c.comment}</p>
                <small>by {c.username} on {new Date(c.created_at).toLocaleDateString()}
                  {c.is_edited && " (edited)"}</small>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ---------- tiny inline styles ---------- */
const btnBack:React.CSSProperties={
  marginBottom:"1rem",padding:"0.5rem 1rem",background:"#3498db",
  color:"#fff",border:"none",borderRadius:5,cursor:"pointer"
};

export default BookInteraction;
