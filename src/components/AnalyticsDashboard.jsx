import { useState, useEffect } from "react";
import { FaChartBar, FaTrophy, FaUsers, FaFile, FaFire, FaStar } from "react-icons/fa";

const AnalyticsDashboard = ({ API_BASE, isAdmin = false }) => {
  const [stats, setStats] = useState(null);
  const [popularNotes, setPopularNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicStats();
  }, []);

  const fetchPublicStats = async () => {
    try {
      const statsResponse = await fetch(`${API_BASE}/api/files/stats`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          total_notes: statsData.total_files || 0,
          total_users: statsData.total_users || 0,
          departments: statsData.departments || {},
          subjects: statsData.subjects || {}
        });
      } else {
        setStats({
          total_notes: 0,
          total_users: 0,
          departments: {},
          subjects: {}
        });
      }

      try {
        const notesResponse = await fetch(`${API_BASE}/api/files/notes`);
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          setPopularNotes((notesData.files || []).slice(0, 6));
        }
      } catch (err) {
        console.log('Notes endpoint error:', err);
      }

    } catch (error) {
      console.error("Error fetching stats:", error);
      setError("Unable to load analytics. Some features may not be available yet.");
      setStats({
        total_notes: 0,
        total_users: 0,
        departments: {},
        subjects: {}
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          📊 Platform Analytics
        </h1>

        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">{error}</p>
          </div>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Notes</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.total_notes}
                    </p>
                  </div>
                  <FaFile className="text-4xl text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {stats.total_users}
                    </p>
                  </div>
                  <FaUsers className="text-4xl text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Departments</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {Object.keys(stats.departments || {}).length}
                    </p>
                  </div>
                  <FaChartBar className="text-4xl text-purple-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Subjects</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {Object.keys(stats.subjects || {}).length}
                    </p>
                  </div>
                  <FaTrophy className="text-4xl text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Notes List */}
            {popularNotes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaFire className="text-orange-500" /> Recent Notes
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {popularNotes.map((note) => (
                    <div
                      key={note.id}
                      className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {note.filename || note.name || "Untitled"}
                      </h3>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-500" />
                          <span>{note.downloads || 0} downloads</span>
                        </div>
                        {note.department && (
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                            {note.department}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Department Breakdown */}
            {Object.keys(stats.departments || {}).length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  📚 Departments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.departments).map(([dept, count]) => (
                    <div
                      key={dept}
                      className="bg-gray-50 dark:bg-gray-700 rounded p-4 text-center"
                    >
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{dept}</p>
                      <p className="text-2xl font-bold text-blue-600">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject Breakdown */}
            {Object.keys(stats.subjects || {}).length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  🎓 Subjects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(stats.subjects).map(([subject, count]) => (
                    <div
                      key={subject}
                      className="bg-gray-50 dark:bg-gray-700 rounded p-4 text-center"
                    >
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{subject}</p>
                      <p className="text-2xl font-bold text-green-600">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
