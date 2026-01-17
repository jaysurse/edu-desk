import { useState, useEffect } from "react";
import { FaHeart, FaRegHeart, FaPlus, FaTrash } from "react-icons/fa";

const FavoritesCollections = ({ userId, API_BASE }) => {
  const [favorites, setFavorites] = useState([]);
  const [collections, setCollections] = useState([]);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("favorites");

  useEffect(() => {
    if (userId) {
      fetchFavorites();
      fetchCollections();
    }
  }, [userId]);

  const fetchFavorites = async () => {
    try {
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
    }
  };

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/collections`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDesc
        })
      });

      if (response.ok) {
        setNewCollectionName("");
        setNewCollectionDesc("");
        setShowCreateCollection(false);
        fetchCollections();
      }
    } catch (error) {
      console.error("Error creating collection:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCollection = async (collectionId) => {
    if (!confirm("Delete this collection?")) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/collections/${collectionId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCollections();
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
    }
  };

  const removeFavorite = async (noteId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/community/favorites/${noteId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchFavorites();
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  if (!userId) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <p className="text-blue-900 dark:text-blue-200">
          Sign in to save favorites and create collections
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("favorites")}
          className={`flex-1 px-6 py-4 font-medium transition ${
            activeTab === "favorites"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FaRegHeart className="inline mr-2" />
          Favorites ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab("collections")}
          className={`flex-1 px-6 py-4 font-medium transition ${
            activeTab === "collections"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <FaPlus className="inline mr-2" />
          Collections ({collections.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === "favorites" ? (
          <div className="space-y-4">
            {favorites.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                No favorites yet. Add notes to favorites to see them here.
              </p>
            ) : (
              favorites.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {note.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {note.subject} • {note.department}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      by {note.uploader}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFavorite(note.id)}
                    className="ml-4 text-red-600 hover:text-red-700 p-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Create Collection Button */}
            {!showCreateCollection ? (
              <button
                onClick={() => setShowCreateCollection(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FaPlus />
                Create New Collection
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input
                  type="text"
                  placeholder="Collection name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={createCollection}
                    disabled={loading || !newCollectionName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateCollection(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Collections List */}
            <div className="space-y-3 mt-4">
              {collections.length === 0 ? (
                <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                  No collections yet. Create one to organize your notes.
                </p>
              ) : (
                collections.map((collection) => (
                  <div
                    key={collection.collection_id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {collection.name}
                        </h4>
                        {collection.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteCollection(collection.collection_id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {collection.notes.length} notes
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesCollections;
