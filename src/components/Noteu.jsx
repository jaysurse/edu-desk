import { useState, useEffect } from "react";
import { FaDownload, FaTrash, FaBook, FaUser } from "react-icons/fa";

const staticNotes = [
  {
    id: "static1",
    title: "Operating System Notes",
    subject: "OS",
    uploader: "Shree Jejurikar",
  },
  {
    id: "static2",
    title: "Data Structures (Stack & Queue)",
    subject: "DSA",
    uploader: "Sujay Dongre",
  },
  {
    id: "static3",
    title: "Python Basics Notes",
    subject: "Python",
    uploader: "Jay Surse",
  },
];

const NotesPreview = () => {
  const [savedNotes, setSavedNotes] = useState([]);

  useEffect(() => {
    const storedNotes = JSON.parse(localStorage.getItem("notes")) || [];
    setSavedNotes(storedNotes);
  }, []);

  const handleDelete = (id) => {
    const updatedNotes = savedNotes.filter((note) => note.id !== id);
    setSavedNotes(updatedNotes);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
  };

  const allNotes = [...savedNotes, ...staticNotes];

  return (
    <section id="notes" className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-12">
          Recent Notes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {allNotes.map((note, index) => {
            const isSaved = savedNotes.some((n) => n.id === note.id);
            return (
              <div
                key={note.id}
                data-aos="fade-up"
                data-aos-delay={index * 100}
                className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-2xl transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <FaBook className="text-blue-600" />
                    <span className="font-medium">{note.subject}</span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <FaUser className="text-green-600" />
                    <span className="font-medium">{note.uploader}</span>
                  </p>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${
                      isSaved
                        ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-white"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
                    }`}
                  >
                    {isSaved ? "Uploaded Note" : "Static Note"}
                  </span>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <button
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    disabled
                  >
                    <FaDownload />
                    Download
                  </button>

                  {isSaved && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NotesPreview;
