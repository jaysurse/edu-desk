import { useState, useEffect } from "react";
import { IoMdClose } from "react-icons/io";
import { FaEdit, FaCheck, FaTimes, FaEye, FaDownload, FaTrash } from "react-icons/fa";

const ProfileModal = ({ isOpen, onClose, user, API_BASE, notes, deleteNote, downloadNote }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [likedNotes, setLikedNotes] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    college: "",
    bio: "",
  });

  // Refresh data when modal opens or when navigating between tabs
  useEffect(() => {
    if (isOpen && user) {
      fetchProfileData();
      fetchSharedNotes();
      fetchLikedNotes();
      fetchUserStats();
      // Initialize edit form with user data
      setEditFormData({
        name: user.displayName || "",
        college: profileData?.college || "",
        bio: profileData?.bio || "",
      });
    }
  }, [isOpen, user]);

  // Refresh likes when switching to likes tab
  useEffect(() => {
    if (isOpen && user && activeTab === "likes") {
      fetchLikedNotes();
    }
  }, [activeTab]);

  // Update edit form when profile data changes
  useEffect(() => {
    if (profileData) {
      setEditFormData({
        name: user.displayName || "",
        college: profileData.college || "",
        bio: profileData.bio || "",
      });
    }
  }, [profileData, user]);

  const fetchProfileData = async () => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/community/user-profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchSharedNotes = async () => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/files/my-notes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSharedNotes(Array.isArray(data) ? data : data.notes || []);
      }
    } catch (error) {
      console.error("Error fetching shared notes:", error);
    }
  };

  const fetchLikedNotes = async () => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/community/user-favorites`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLikedNotes(Array.isArray(data) ? data : data.favorites || []);
      }
    } catch (error) {
      console.error("Error fetching liked notes:", error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/community/user-stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const idToken = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/community/update-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editFormData.name,
          college: editFormData.college,
          bio: editFormData.bio,
        }),
      });

      if (response.ok) {
        setProfileData({
          ...profileData,
          college: editFormData.college,
          bio: editFormData.bio,
        });
        setIsEditingProfile(false);
        alert("Profile updated successfully!");
      } else {
        alert("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all border border-gray-200 dark:border-slate-700">
        {/* Header - Professional Gradient */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 bg-linear-to-r from-slate-800 via-blue-900 to-slate-800 dark:from-slate-800 dark:via-blue-950 dark:to-slate-800">
          <h2 className="text-2xl font-bold text-white tracking-tight">My Profile Hub</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full p-2 transition duration-200"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Tabs - Professional Style */}
        <div className="flex gap-1 p-4 border-b border-gray-100 dark:border-slate-700 overflow-x-auto bg-gray-50 dark:bg-slate-800/50">
          {[
            { id: "profile", label: "👤 Profile", icon: "Profile" },
            { id: "dashboard", label: "📊 Dashboard", icon: "Dashboard" },
            { id: "analytics", label: "📈 Analytics", icon: "Analytics" },
            { id: "shared", label: "📝 Shared Notes", icon: "Shared" },
            { id: "likes", label: "❤️ Likes", icon: "Likes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              {!isEditingProfile ? (
                // View Mode - Professional Card
                <>
                  <div className="bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700/50 p-6 rounded-xl border border-gray-200 dark:border-slate-600">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            className="w-16 h-16 rounded-full border-4 border-blue-600 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {editFormData.name || "User"}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md font-medium"
                      >
                        <FaEdit /> Edit Profile
                      </button>
                    </div>

                    {/* Professional Info Cards */}
                    <div className="grid grid-cols-1 gap-3 mt-6">
                      <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-600 shadow-sm hover:shadow-md transition">
                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide">🎓 College/University</p>
                        <p className="text-base text-slate-900 dark:text-white mt-2 font-medium">
                          {editFormData.college || <span className="text-slate-400">Not added yet</span>}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-slate-700/50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition">
                        <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide">📝 Bio</p>
                        <p className="text-base text-slate-900 dark:text-white mt-2 font-medium">
                          {editFormData.bio || <span className="text-slate-400">No bio added yet</span>}
                        </p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-slate-600">
                      <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg text-center hover:shadow-md transition border border-blue-200 dark:border-blue-700/30">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats?.notes_count || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">Notes</p>
                      </div>
                      <div className="bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-lg text-center hover:shadow-md transition border border-purple-200 dark:border-purple-700/30">
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats?.rating_count || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">Ratings</p>
                      </div>
                      <div className="bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-4 rounded-lg text-center hover:shadow-md transition border border-emerald-200 dark:border-emerald-700/30">
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{userStats?.favorites_count || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">Favorites</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Edit Mode - Professional Form
                <div className="bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700/50 p-6 rounded-xl border border-gray-200 dark:border-slate-600">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">✏️ Edit Your Profile</h3>

                  <div className="space-y-5">
                    {/* Name Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, name: e.target.value })
                        }
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      />
                    </div>

                    {/* College Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        🎓 College/University
                      </label>
                      <input
                        type="text"
                        value={editFormData.college}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, college: e.target.value })
                        }
                        placeholder="e.g., MIT, Stanford, Oxford, etc."
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                      />
                    </div>

                    {/* Bio Field */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        📝 Bio
                      </label>
                      <textarea
                        value={editFormData.bio}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself (max 200 characters)"
                        maxLength="200"
                        rows="4"
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-500 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition resize-none"
                      />
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-medium">
                        {editFormData.bio.length}/200 characters
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-600">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition duration-200 font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaCheck /> Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition duration-200 font-semibold shadow-md"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📊 My Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-linear-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 p-5 rounded-lg border border-blue-200 dark:border-blue-700/30 hover:shadow-lg transition">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats?.notes_count || 0}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Total Notes</p>
                </div>
                <div className="bg-linear-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 p-5 rounded-lg border border-purple-200 dark:border-purple-700/30 hover:shadow-lg transition">
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{sharedNotes?.length || 0}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Shared Notes</p>
                </div>
                <div className="bg-linear-to-br from-cyan-100 to-cyan-50 dark:from-cyan-900/30 dark:to-cyan-800/20 p-5 rounded-lg border border-cyan-200 dark:border-cyan-700/30 hover:shadow-lg transition">
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{likedNotes?.length || 0}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Liked Notes</p>
                </div>
                <div className="bg-linear-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 p-5 rounded-lg border border-amber-200 dark:border-amber-700/30 hover:shadow-lg transition">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{userStats?.rating_count || 0}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">Ratings Given</p>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">📈 My Analytics</h3>
              <div className="space-y-4">
                <div className="bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-lg border border-blue-200 dark:border-blue-700/30 hover:shadow-lg transition">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Total Views on Your Notes</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-3">
                    {userStats?.total_views || 0}
                  </p>
                </div>
                <div className="bg-linear-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-5 rounded-lg border border-emerald-200 dark:border-emerald-700/30 hover:shadow-lg transition">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Average Rating</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                    {(userStats?.avg_rating || 0).toFixed(1)} <span className="text-2xl">/ 5 ⭐</span>
                  </p>
                </div>
                <div className="bg-linear-to-r from-slate-100 to-slate-50 dark:from-slate-700/30 dark:to-slate-600/20 p-5 rounded-lg border border-slate-200 dark:border-slate-700/30 hover:shadow-lg transition">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Account Created</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                    {user.metadata?.createdAt
                      ? new Date(user.metadata.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })
                      : "Recently"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Shared Notes Tab */}
          {activeTab === "shared" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                📝 My Shared Notes ({sharedNotes?.length || 0})
              </h3>
              {sharedNotes && sharedNotes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {sharedNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600/50 transition"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                        {note.title || "Untitled"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <span className="font-medium">{note.subject || "No subject"}</span> • {note.department || "No dept"}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setPreviewNote(note)}
                          className="flex-1 text-xs px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium flex items-center justify-center gap-1"
                        >
                          <FaEye /> Preview
                        </button>
                        <button
                          onClick={() => downloadNote && downloadNote(note)}
                          className="flex-1 text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center gap-1"
                        >
                          <FaDownload /> Download
                        </button>
                        <button
                          onClick={() => deleteNote && deleteNote(note)}
                          className="flex-1 text-xs px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium flex items-center justify-center gap-1"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12 font-medium">No shared notes yet. Start uploading! 📚</p>
              )}
            </div>
          )}

          {/* Likes Tab */}
          {activeTab === "likes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  ❤️ My Likes ({likedNotes?.length || 0})
                </h3>
                <button
                  onClick={fetchLikedNotes}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  🔄 Refresh
                </button>
              </div>
              {likedNotes && likedNotes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {likedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-red-300 dark:hover:border-red-600/50 transition"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">
                        {note.title || "Untitled"}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <span className="font-medium">By: {note.uploader || note.uploaded_by || "Unknown"}</span> • {note.subject || "No subject"}
                      </p>
                      {note.department && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          🏢 {note.department}
                        </p>
                      )}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setPreviewNote(note)}
                          className="flex-1 text-xs px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium flex items-center justify-center gap-1"
                        >
                          <FaEye /> Preview
                        </button>
                        <button
                          onClick={() => {
                            const filename = note.filename || `${note.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                            downloadNote && downloadNote(note.id, filename);
                          }}
                          className="flex-1 text-xs px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center gap-1"
                        >
                          <FaDownload /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center py-12 font-medium">No liked notes yet. Start liking notes! ❤️</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Preview Modal */}
      {previewNote && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-linear-to-r from-purple-600 to-blue-600">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white truncate">{previewNote.title || "Untitled Note"}</h2>
                <p className="text-sm text-purple-100 mt-1">
                  {previewNote.subject} • {previewNote.department} • {previewNote.semester || "N/A"}
                </p>
              </div>
              <button
                onClick={() => setPreviewNote(null)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition ml-4"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Note Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide">Uploaded By</p>
                    <p className="text-sm text-slate-900 dark:text-white mt-2 font-medium">{previewNote.uploaded_by || "Anonymous"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide">Upload Date</p>
                    <p className="text-sm text-slate-900 dark:text-white mt-2 font-medium">
                      {previewNote.uploaded_at 
                        ? new Date(previewNote.uploaded_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide">File Size</p>
                    <p className="text-sm text-slate-900 dark:text-white mt-2 font-medium">
                      {previewNote.file_size 
                        ? `${(previewNote.file_size / 1024 / 1024).toFixed(2)} MB`
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide">File Type</p>
                    <p className="text-sm text-slate-900 dark:text-white mt-2 font-medium uppercase">
                      {previewNote.file_type || previewNote.filename?.split('.').pop() || "PDF"}
                    </p>
                  </div>
                </div>

                {/* Note Description/Content Preview */}
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide mb-3">Description</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {previewNote.description || "No description available for this note."}
                  </p>
                </div>

                {/* PDF/File Preview (if supported) */}
                {previewNote.file_url && (previewNote.file_type === 'pdf' || previewNote.filename?.endsWith('.pdf')) && (
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-semibold tracking-wide mb-3">Document Preview</p>
                    <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: '400px' }}>
                      <iframe
                        src={`${previewNote.file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                        className="w-full h-full"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                )}

                {/* Stats if available */}
                {(previewNote.downloads || previewNote.rating || previewNote.views) && (
                  <div className="grid grid-cols-3 gap-3">
                    {previewNote.views !== undefined && (
                      <div className="bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-4 rounded-lg text-center border border-blue-200 dark:border-blue-700/30">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{previewNote.views || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Views</p>
                      </div>
                    )}
                    {previewNote.downloads !== undefined && (
                      <div className="bg-linear-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-4 rounded-lg text-center border border-emerald-200 dark:border-emerald-700/30">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{previewNote.downloads || 0}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Downloads</p>
                      </div>
                    )}
                    {previewNote.rating !== undefined && (
                      <div className="bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-4 rounded-lg text-center border border-amber-200 dark:border-amber-700/30">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{previewNote.rating?.toFixed(1) || 0} ⭐</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Rating</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Footer Actions */}
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => {
                  downloadNote && downloadNote(previewNote);
                  setPreviewNote(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
              >
                <FaDownload /> Download Note
              </button>
              <button
                onClick={() => setPreviewNote(null)}
                className="px-6 py-3 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition font-semibold shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModal;
