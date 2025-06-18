import { useState } from "react";

const staticNotes = [
  {
    id: "static1",
    title: "Operating System Notes",
    subject: "OS",
    uploader: "Shree Jejurikar",
    department: "Computer",
  },
  {
    id: "static2",
    title: "Data Structures (Stack & Queue)",
    subject: "DSA",
    uploader: "Sujay Dongre",
    department: "Computer",
  },
  {
    id: "static3",
    title: "Python Basics Notes",
    subject: "Python",
    uploader: "Jay Surse",
    department: "Computer",
  },
];

const NotesPreview = ({ notes, deleteNote, selectedDept }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const allNotes = [...notes, ...staticNotes];

  const filteredNotes = allNotes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.uploader.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDept === "All" || note.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">
          Recent Notes
        </h2>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="relative w-full md:w-full">
            <input
              type="text"
              placeholder="🔍 Search by title, subject, or uploader..."
              className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {filteredNotes.length === 0 && (
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
            No notes available for this department.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {note.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  📘 Subject:{" "}
                  <span className="font-medium">{note.subject}</span>
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  🧑 Uploaded by:{" "}
                  <span className="font-medium">{note.uploader}</span>
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  🏢 Department:{" "}
                  <span className="font-medium">
                    {note.department || "N/A"}
                  </span>
                </p>
              </div>

              <div className="flex justify-between items-center">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  disabled
                >
                  Download 🚫
                </button>

                {notes.some((n) => n.id === note.id) && (
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NotesPreview;
