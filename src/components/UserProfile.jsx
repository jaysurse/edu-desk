import { useState, useEffect } from "react";
import { FaUser, FaMedal, FaTrophy, FaFileAlt, FaEdit, FaSave, FaTimes } from "react-icons/fa";

const UserProfile = ({ user, API_BASE }) => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
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
        alert('Failed to update profile. The endpoint may not be available yet.');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
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

          <div className="p-6 border-b dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Bio</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {profile.bio || "No bio available. Click 'Edit' to add one."}
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-4 p-6">
              <div className="text-center">
                <FaFileAlt className="text-3xl text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_uploads}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploads</p>
              </div>
              <div className="text-center">
                <FaTrophy className="text-3xl text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_downloads}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Downloads</p>
              </div>
              <div className="text-center">
                <FaMedal className="text-3xl text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total_ratings}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ratings</p>
              </div>
            </div>
          )}
        </div>

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

export default UserProfile;
