import { useState, useEffect } from "react";
import { FaDownload, FaHeart, FaClock, FaSearch } from "react-icons/fa";

const UserDashboard = ({ userId, API_BASE }) => {
  const [activeTab, setActiveTab] = useState("uploads");
  const [myNotes, setMyNotes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (userId) {
      if (activeTab === "uploads") {
        fetchMyNotes();
      } else if (activeTab === "favorites") {
        fetchFavorites();
      } else if (activeTab === "activity") {
        fetchRecentActivity();
      }
    }
  }, [userId, activeTab]);

  const fetchMyNotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/files/my-notes`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyNotes(data.notes || []);
      }
    } catch (error) {
      console.error("Error fetching my notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/favorites`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      // This would track user actions
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/analytics/users/${userId}/stats`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Mock recent activity
        setRecentActivity([
          { type: "download", note: data.profile?.recent_notes?.[0], time: "2 hours ago" },
          { type: "upload", note: data.profile?.recent_notes?.[1], time: "1 day ago" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotes = myNotes.filter(note =>
    note.title.toLowerCase().includes(filter.toLowerCase()) ||
    note.subject.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredFavorites = favorites.filter(note =>
    note.title.toLowerCase().includes(filter.toLowerCase()) ||
    note.subject.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: "uploads", label: "My Uploads", icon: "📤" },
          { id: "favorites", label: "Favorites", icon: "❤️" },
          { id: "activity", label: "Recent Activity", icon: "⏱️" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-6 py-4 font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Search Filter */}
        {(activeTab === "uploads" || activeTab === "favorites") && (
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">Loading...</p>
          ) : activeTab === "uploads" ? (
            filteredNotes.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                {filter ? "No notes match your search" : "You haven't uploaded any notes yet"}
              </p>
            ) : (
              filteredNotes.map(note => (
                <div
                  key={note.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {note.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {note.subject} • {note.department}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <FaDownload /> {note.download_count} downloads
                        </span>
                        <span>{Math.round(note.file_size / 1024)} KB</span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      className="ml-4 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )
          ) : activeTab === "favorites" ? (
            filteredFavorites.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                {filter ? "No favorites match your search" : "No favorites yet"}
              </p>
            ) : (
              filteredFavorites.map(note => (
                <div
                  key={note.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {note.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        by {note.uploader}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {note.subject} • {note.department}
                      </p>
                    </div>
                    <button
                      className="ml-4 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  No recent activity
                </p>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-4"
                  >
                    <div className="text-2xl">
                      {activity.type === "download" ? "📥" : "📤"}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.type === "download" ? "Downloaded" : "Uploaded"}: {activity.note?.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
