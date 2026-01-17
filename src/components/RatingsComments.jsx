import { useState, useEffect } from "react";
import apiRequest from "../utils/api";
import { FaStar, FaComment, FaTrash, FaHeart } from "react-icons/fa";

const RatingsComments = ({ noteId, userId }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);

  useEffect(() => {
    fetchRatings();
    fetchComments();
  }, [noteId]);

  const fetchRatings = async () => {
    const res = await apiRequest(`/api/community/notes/${noteId}/ratings`);
    if (res.success) {
      setRatings(res.data);
    }
  };

  const fetchComments = async () => {
    const res = await apiRequest(`/api/community/notes/${noteId}/comments`);
    if (res.success) {
      setComments(res.data.comments || []);
    }
  };

  const submitRating = async (value) => {
    if (!userId) return;
    setLoading(true);
    const res = await apiRequest(`/api/community/notes/${noteId}/rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
      body: JSON.stringify({ rating: value })
    });
    if (res.success) {
      setUserRating(value);
      fetchRatings();
    }
    setLoading(false);
  };

  const submitComment = async () => {
    if (!userId || !newComment.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/notes/${noteId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });

      if (response.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const likeComment = async (commentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/community/comments/${commentId}/like`, {
        method: "POST"
      });
      
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-6">
      {/* Ratings Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaStar className="text-yellow-400" />
          Ratings
        </h3>

        {ratings && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {ratings.average}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {ratings.total_ratings} ratings
              </span>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{star}★</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${ratings.total_ratings > 0 ? (ratings.distribution[star] / ratings.total_ratings) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {ratings.distribution[star]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Rating Input */}
        {userId && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rate:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => submitRating(star)}
                  className={`text-2xl transition ${
                    star <= (userRating || 0)
                      ? "text-yellow-400"
                      : "text-gray-300 hover:text-yellow-300"
                  }`}
                  disabled={loading}
                >
                  <FaStar />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaComment />
          Comments ({comments.length})
        </h3>

        {/* New Comment Input */}
        {userId && (
          <div className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
            <button
              onClick={submitComment}
              disabled={loading || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Post Comment
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4">No comments yet</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.comment_id}
                className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {comment.user_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {userId === comment.user_id && (
                    <button
                      onClick={() => deleteComment(comment.comment_id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Delete comment"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
                <p className="text-gray-800 dark:text-gray-200">{comment.text}</p>
                <button
                  onClick={() => likeComment(comment.comment_id)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <FaHeart /> {comment.likes}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingsComments;
