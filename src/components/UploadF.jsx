import { useState } from "react";
import { motion } from "framer-motion";
import { FaCloudUploadAlt, FaCheckCircle } from "react-icons/fa";

const UploadForm = ({ addNote, notes }) => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    uploader: "",
    department: "",
    file: null,
  });

  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.subject ||
      !formData.uploader ||
      !formData.department ||
      !formData.file
    ) {
      alert("Please fill all fields and upload a file.");
      return;
    }

    const newNote = {
      id: Date.now(),
      title: formData.title,
      subject: formData.subject,
      uploader: formData.uploader,
      department: formData.department,
      fileName: formData.file.name,
    };

    addNote(newNote); // 🔥 Pass to parent App.jsx

    setFormData({
      title: "",
      subject: "",
      uploader: "",
      department: "",
      file: null,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <section
      id="upload"
      className="py-16 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="max-w-xl mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-10"
        >
          <FaCloudUploadAlt className="inline-block text-blue-600 mr-2" />
          Upload Your Notes
        </motion.h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl space-y-6"
        >
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Note Title"
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-400"
            required
          />

          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-400"
            required
          >
            <option value="">Select Subject</option>
            <option value="OS">Operating System</option>
            <option value="DSA">Data Structures</option>
            <option value="Python">Python</option>
            <option value="CN">Computer Networks</option>
          </select>

          <input
            type="text"
            name="uploader"
            value={formData.uploader}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-400"
            required
          />

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-400"
            required
          >
            <option value="">Select Department</option>
            <option value="Computer">💻 Computer</option>
            <option value="IT">🖥️ IT</option>
            <option value="Civil">🏗️ Civil</option>
            <option value="ENTC">📡 ENTC</option>
          </select>

          <input
            type="file"
            name="file"
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded"
            required
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition"
          >
            Upload Note
          </motion.button>

          {success && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 flex items-center gap-2 justify-center font-medium mt-4"
            >
              <FaCheckCircle /> Note uploaded successfully!
            </motion.p>
          )}
        </form>

        {/* Display notes */}
        <div className="mt-10">
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
            Your Uploaded Notes
          </h3>
          {notes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">
              No notes uploaded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="bg-gray-100 dark:bg-gray-700 p-4 rounded flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {note.title}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Subject: {note.subject} | By: {note.uploader}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      File: {note.fileName}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 dark:text-gray-400 cursor-not-allowed"
                    title="Download not implemented"
                    disabled
                  >
                    🚫 Download
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default UploadForm;
