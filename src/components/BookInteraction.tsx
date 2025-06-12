/* -------- src/components/BookInteraction.tsx -------- */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import StarRating from "./StarRating";
import { User } from "../types";

/* ─────────────── types ─────────────── */
interface Comment {
  comment_id: string;
  comment: string;
  created_at: string;
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

/* ───────────────── component ───────────────── */
export default function BookInteraction({ user }: Props) {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();

  /* state */
  const [book, setBook]        = useState<Book | null>(null);
  const [comments,setComments] = useState<Comment[]>([]);
  const [comment,setComment]   = useState("");
  const [rating,setRating]     = useState(0);
  const [avg,setAvg]           = useState(0);
  const [count,setCount]       = useState(0);
  const [bookErr,setBookErr]   = useState("");
  const [auxErr,setAuxErr]     = useState("");

  /* ── load ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${id}`
        );
        if (!res.ok) throw new Error("google");
        setBook(await res.json());
      } catch { setBookErr("Couldn’t load book data."); return; }

      try {
        const { data } = await api.get(`/api/comments/${id}`);
        setComments(data.comments);
        const r = await api.get(`/api/ratings/${id}/average`);
        setAvg(r.data.average_rating); setCount(r.data.rating_count);
      } catch {/* ignore aux errors */}
    })();
  }, [id]);

  /* helper */
  const ensureBook = () => api.post("/api/books", {
    google_book_id: id,
    title: book?.volumeInfo.title ?? "Unknown",
    authors: book?.volumeInfo.authors ?? [],
    description: book?.volumeInfo.description ?? "",
    image_url: book?.volumeInfo.imageLinks?.thumbnail ?? "",
  });

  /* rating */
  const rate = async (v:number) => {
    if(!user) return setAuxErr("Login to rate"); setAuxErr("");
    await ensureBook();
    await api.post("/api/ratings",
      { google_book_id:id, rating:v },
      { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` } });
    setRating(v);
    const { data } = await api.get(`/api/ratings/${id}/average`);
    setAvg(data.average_rating); setCount(data.rating_count);
  };

  /* comment */
  const addComment = async () => {
    if(!user) return setAuxErr("Login to comment");
    if(!comment.trim()) return setAuxErr("Empty comment");
    setAuxErr("");
    await ensureBook();
    const { data } = await api.post("/api/comments",
      { google_book_id:id, comment:comment.trim() },
      { headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` } });
    setComments([data.comment,...comments]);
    setComment("");
  };

  /* ── render ── */
  if(bookErr) return <p style={{color:"tomato",padding:32}}>{bookErr}</p>;
  if(!book)   return <p style={{padding:32}}>Loading…</p>;

  return (
    <div style={card}>
      <button onClick={()=>nav(-1)} style={btnBack}>← Back</button>

      <h1 style={{marginTop:0}}>{book.volumeInfo.title}</h1>
      {auxErr && <p style={{color:"#f1c40f"}}>{auxErr}</p>}

      {/* cover + description */}
      <div style={row}>
        <img
          src={book.volumeInfo.imageLinks?.thumbnail}
          alt={book.volumeInfo.title}
          style={cover}
        />
        <div style={{flex:1}}>
          <p
            dangerouslySetInnerHTML={{
              __html: book.volumeInfo.description ?? "No description",
            }}
          />
        </div>
      </div>

      {/* rating */}
      <div style={{marginTop:24}}>
        <h3>Rate this book</h3>
        {!user && <p>Please <Link to="/">login</Link> to rate</p>}
        <StarRating onRatingSelect={rate}/>
        <span style={pill}>{avg.toFixed(1)} ★</span>
        <small>&nbsp;({count})</small>
        {rating>0 && <p>Your rating: {rating} ★</p>}
      </div>

      {/* comments */}
      <div style={{marginTop:24}}>
        <h3>Comments</h3>
        {!user && <p>Please <Link to="/">login</Link> to comment</p>}
        <textarea
          rows={3} style={ta} disabled={!user}
          value={comment} onChange={e=>setComment(e.target.value)}
        />
        <br/>
        <button onClick={addComment} disabled={!user} style={btn}>
          Add Comment
        </button>

        <ul style={ul}>
          {comments.map(c=>(
            <li key={c.comment_id} style={li}>
              <p>{c.comment}</p>
              <small>
                {c.username} • {new Date(c.created_at).toLocaleDateString()}
                {c.is_edited && " (edited)"}
              </small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────── inline styles ─────────────── */
const card:React.CSSProperties={
  maxWidth:900,margin:"32px auto",padding:32,
  background:"#1e1e1e",color:"#f3f3f3",
  borderRadius:12,boxShadow:"0 4px 18px #0008",
};
const row:React.CSSProperties={
  display:"flex",gap:32,alignItems:"flex-start",
};
const cover:React.CSSProperties={
  width:180,height:260,objectFit:"cover",
  borderRadius:8,boxShadow:"0 0 10px #0005",
};
const pill:React.CSSProperties={
  display:"inline-block",background:"#444",
  borderRadius:20,padding:"2px 12px",fontWeight:600,marginLeft:8,
};
const ta:React.CSSProperties={
  width:"100%",padding:8,fontSize:16,borderRadius:6,
  background:"#2b2b2b",color:"#f3f3f3",border:"1px solid #555"
};
const ul:React.CSSProperties={listStyle:"none",padding:0,marginTop:16};
const li:React.CSSProperties={padding:"12px 0",borderBottom:"1px solid #333"};
const btn:React.CSSProperties={
  marginTop:8,padding:"6px 16px",border:"none",borderRadius:6,
  background:"#3498db",color:"#fff",cursor:"pointer"
};
const btnBack:React.CSSProperties={...btn,marginBottom:16};

