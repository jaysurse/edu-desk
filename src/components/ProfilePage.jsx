import { useState, useEffect } from "react";
import { FaUser, FaMedal, FaTrophy, FaFileAlt, FaEdit, FaSave, FaTimes, FaHeart, FaChartBar, FaArrowLeft } from "react-icons/fa";

const ProfilePage = ({ user, API_BASE, notes, deleteNote, downloadNote, setActiveSection }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [userNotes, setUserNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    bio: "",
    photo_url: ""
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
      fetchUserNotes();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/community/profiles/${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile || {});
        setEditData({
          name: data.profile?.display_name || user.displayName || "",
          bio: data.profile?.bio || "",
          photo_url: data.profile?.photo_url || user.photoURL || ""
        });
      } else {
        setProfile({
          user_id: user.uid,
          display_name: user.displayName || user.email?.split('@')[0],
          photo_url: user.photoURL,
          reputation: 0,
          badges: []
        });
        setEditData({
          name: user.displayName || user.email?.split('@')[0] || "",
          bio: "",
          photo_url: user.photoURL || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile({
        user_id: user.uid,
        display_name: user.displayName || user.email?.split('@')[0],
        photo_url: user.photoURL,
        reputation: 0,
        badges: []
      });
    }
  };

  const fetchStats = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/files/my-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats({
          total_uploads: data.files?.length || 0,
          total_downloads: 0,
          total_ratings: 0
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        total_uploads: 0,
        total_downloads: 0,
        total_ratings: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNotes = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/files/my-notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserNotes(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching user notes:", error);
      setUserNotes([]);
    }
  };

  const updateProfile = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_BASE}/api/community/profiles/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: editData.name,
          bio: editData.bio,
          photo_url: editData.photo_url
        })
      });

      if (response.ok) {
        await fetchProfile();
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile.');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Error updating profile. Please try again.');
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        {setActiveSection && (
          <button
            onClick={() => setActiveSection("home")}
            className="mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
          >
            <FaArrowLeft /> Back to Home
          </button>
        )}
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8">
            <div className="flex items-center gap-6">
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-300 flex items-center justify-center">
                  <FaUser className="text-4xl text-gray-600" />
                </div>
              )}
              <div className="text-white flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {profile.display_name || user.displayName || user.email}
                </h1>
                <p className="text-blue-100">{user.email}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <FaTrophy className="text-yellow-400" />
                    <span>{profile.reputation || 0} Reputation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMedal className="text-yellow-400" />
                    <span>{profile.badges?.length || 0} Badges</span>
                  </div>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition flex items-center gap-2"
                >
                  <FaEdit /> Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="flex border-b dark:border-gray-700">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "profile"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <FaUser /> My Profile
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex-1 py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "dashboard"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <FaFileAlt /> My Dashboard
            </button>
            <button
              onClick={() => setActiveTab("favorites")}
              className={`flex-1 py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "favorites"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <FaHeart /> Favorites
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-4 px-6 font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "analytics"
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <FaChartBar /> My Analytics
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bio</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile.bio || "No bio available. Click 'Edit' to add one."}
                  </p>
                </div>

                {stats && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center border rounded-lg p-4">
                      <FaFileAlt className="text-3xl text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total_uploads}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uploads</p>
                    </div>
                    <div className="text-center border rounded-lg p-4">
                      <FaTrophy className="text-3xl text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total_downloads}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Downloads</p>
                    </div>
                    <div className="text-center border rounded-lg p-4">
                      <FaMedal className="text-3xl text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total_ratings}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ratings</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Uploaded Notes</h3>
                {userNotes.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    You haven't uploaded any notes yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userNotes.map((note) => (
                      <div key={note.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate mb-2">
                          {note.filename || note.name}
                        </h4>
                        <div className="flex gap-2 flex-wrap text-xs mb-4">
                          {note.department && (
                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {note.department}
                            </span>
                          )}
                          {note.subject && (
                            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                              {note.subject}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => downloadNote(note.id, note.filename)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this note?')) {
                                deleteNote(note.id);
                              }
                            }}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Favorites</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  Favorites feature coming soon. Save your favorite notes here!
                </p>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">Total Views</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">Total Downloads</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.total_downloads || 0}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">Average Rating</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">0</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updateProfile}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FaSave /> Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
