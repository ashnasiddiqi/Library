import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Comment {
  comment_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  username: string;
  google_book_id: string;
  title: string;
}

interface ProfileProps {
  user: { id: string; username: string; email: string; role: string } | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [editCommentId, setEditCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchComments = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/comments/user/comments", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setComments(response.data.comments);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch comments");
      }
    };

    fetchComments();
  }, [user, navigate]);

  const handleEdit = async (commentId: string) => {
    if (!editCommentText) {
      setError("Comment text cannot be empty");
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/comments/${commentId}`,
        { comment: editCommentText },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setComments(
        comments.map((c) =>
          c.comment_id === commentId
            ? { ...c, comment: editCommentText, is_edited: true, updated_at: new Date().toISOString() }
            : c
        )
      );
      setEditCommentId(null);
      setEditCommentText("");
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to edit comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setComments(comments.filter((c) => c.comment_id !== commentId));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete comment");
    }
  };

  const handleBackToMain = () => {
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="text-center">{user.role === "admin" ? "Admin: All Comments" : "My Comments"}</h2>
        <button className="btn" onClick={handleBackToMain}>
          Back to Main Page
        </button>
      </div>
      {error && <p className="text-center" style={{ color: "red" }}>{error}</p>}
      {comments.length === 0 ? (
        <p className="text-center">No comments found.</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.comment_id} className="card mt-2">
              <div className="card-body">
                <h5>{comment.title}</h5>
                <p><strong>By:</strong> {comment.username}</p>
                {editCommentId === comment.comment_id ? (
                  <div>
                    <textarea
                      className="form-control"
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                    />
                    <button
                      className="btn mt-2"
                      onClick={() => handleEdit(comment.comment_id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn mt-2"
                      onClick={() => setEditCommentId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p>{comment.comment}</p>
                    <p>
                      <small>
                        Created: {new Date(comment.created_at).toLocaleString()}
                      </small>
                    </p>
                    {comment.is_edited && (
                      <p>
                        <small>
                          Edited: {new Date(comment.updated_at).toLocaleString()}
                        </small>
                      </p>
                    )}
                    {user.role === "admin" && (
                      <div>
                        <button
                          className="btn mt-2"
                          onClick={() => {
                            setEditCommentId(comment.comment_id);
                            setEditCommentText(comment.comment);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn mt-2"
                          onClick={() => handleDelete(comment.comment_id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;