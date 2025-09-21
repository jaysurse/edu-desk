import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaCheckCircle,
  FaSignInAlt,
  FaLock,
} from "react-icons/fa";

// Custom File Upload Component
const CustomFileUpload = ({
  onFileSelect,
  accept = ".pdf,.doc,.docx,.txt",
  disabled = false,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const openFileSelector = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleInputChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={openFileSelector}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${
            dragActive
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${
            selectedFile
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600"
              : "bg-gray-50 dark:bg-gray-700"
          }
        `}
      >
        {!selectedFile ? (
          <div>
            <div className="mb-3">
              <FaCloudUploadAlt className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              <p className="text-base font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm">PDF, DOC, DOCX, TXT files up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="ml-4 text-red-500 hover:text-red-700 transition-colors"
              type="button"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="mt-2 text-center">
          <button
            onClick={openFileSelector}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            type="button"
          >
            Choose a different file
          </button>
        </div>
      )}
    </div>
  );
};

// Login Prompt Component
const LoginPrompt = ({ onLoginClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl text-center"
  >
    <div className="mb-6">
      <FaLock className="mx-auto h-16 w-16 text-amber-500 mb-4" />
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Authentication Required
      </h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Please sign in to upload your notes and share them with the community.
      </p>
    </div>

    <motion.button
      onClick={onLoginClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
    >
      <FaSignInAlt />
      Sign In to Upload
    </motion.button>

    <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
      <ul className="list-none space-y-2">
        <li className="flex items-center gap-2">
          <span>✅</span>
          <span>Upload and share your notes</span>
        </li>
        <li className="flex items-center gap-2">
          <span>✅</span>
          <span>Download notes from other students</span>
        </li>
        <li className="flex items-center gap-2">
          <span>✅</span>
          <span>Build your academic reputation</span>
        </li>
      </ul>
    </div>
  </motion.div>
);

const UploadForm = ({ addNote, notes, onLoginClick, user }) => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    uploader: "",
    department: "",
    file: null,
  });

  const [success, setSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Filter notes to show only those uploaded by the current user
  const userNotes = user ? notes.filter(note => note.uploader_email === user.email) : [];

  // Update uploader field when user prop changes
  useEffect(() => {
    if (user && (user.displayName || user.email)) {
      setFormData((prev) => ({
        ...prev,
        uploader: user.displayName || user.email,
      }));
    } else {
      // Clear form data when user is null (logged out)
      setFormData({
        title: "",
        subject: "",
        uploader: "",
        department: "",
        file: null,
      });
    }
  }, [user]); // Depend on the user prop

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleFileSelect = (file) => {
    setFormData({
      ...formData,
      file: file,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Double-check authentication before submitting
    if (!user) {
      alert("Please sign in to upload files.");
      return;
    }

    if (
      !formData.title ||
      !formData.subject ||
      !formData.department ||
      !formData.file
    ) {
      alert("Please fill all fields and upload a file.");
      return;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (formData.file.size > maxSize) {
      alert("File size must be less than 10MB.");
      return;
    }

    // Check file type
    const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
    const fileExtension = formData.file.name
      .toLowerCase()
      .substring(formData.file.name.lastIndexOf("."));
    if (!allowedTypes.includes(fileExtension)) {
      alert("Only PDF, DOC, DOCX, and TXT files are allowed.");
      return;
    }

    setIsUploading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("subject", formData.subject);
    formDataToSend.append(
      "uploader",
      formData.uploader || user.displayName || user.email
    );
    formDataToSend.append("department", formData.department);
    formDataToSend.append("file", formData.file);

    try {
      // Get the user's ID token for backend authentication
      const idToken = await user.getIdToken(true); // Force refresh to get a fresh token

      const response = await fetch("https://edudesk.onrender.com/api/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`, // Send token for backend verification
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        addNote(result.note);
        setFormData({
          title: "",
          subject: "",
          uploader: user.displayName || user.email || "",
          department: "",
          file: null,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Handle specific error codes from backend
        handleUploadError(result);
      }
    } catch (error) {
      console.error("Upload error:", error);
      handleNetworkError(error);
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to handle upload errors
  const handleUploadError = (result) => {
    switch (result.code) {
      case "INVALID_TOKEN":
      case "NO_TOKEN":
        alert("Authentication failed. Please sign in again.");
        break;
      case "NO_FILE":
      case "NO_FILE_SELECTED":
        alert("Please select a file to upload.");
        break;
      case "INVALID_FILE_TYPE":
        alert(
          "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."
        );
        break;
      case "FILE_TOO_LARGE":
        alert("File size must be less than 10MB.");
        break;
      case "MISSING_FIELDS":
        alert("Please fill in all required fields.");
        break;
      default:
        alert(result.error || "Upload failed. Please try again.");
    }
  };

  // Helper function to handle network errors
  const handleNetworkError = (error) => {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      alert(
        "Unable to connect to server. Please check your internet connection and try again."
      );
    } else if (error.code === "auth/network-request-failed") {
      alert("Network error. Please check your internet connection.");
    } else {
      alert("An unexpected error occurred: " + error.message);
    }
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

        {/* Show login prompt if user is not authenticated */}
        {!user ? (
          <LoginPrompt onLoginClick={onLoginClick} />
        ) : (
          /* Show upload form if user is authenticated */
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <FaCheckCircle className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Welcome, {user.displayName || user.email}!
                  </p>
                  <p className="text-green-600 dark:text-green-300 text-sm">
                    You're all set to upload your notes.
                  </p>
                </div>
              </div>
            </motion.div>

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
                disabled={isUploading}
              />

              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-400"
                required
                disabled={isUploading}
              >
                <option value="">Select Subject</option>
                <option value="JP">JAVA PROGRAMMING</option>
                <option value="SET">
                  SOFTWARE ENGINEERING AND SOFTWARE TESTING
                </option>
                <option value="MAD">MOBILE APPLICATION DEVELOPMENT</option>
                <option value="CS">CYBER SECURITY</option>
                <option value="CC">CLOUD COMPUTING</option>
              </select>

              <input
                type="text"
                name="uploader"
                value={formData.uploader}
                onChange={handleChange}
                placeholder="Your Name (Optional)"
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-400"
                disabled={isUploading}
              />

              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-400"
                required
                disabled={isUploading}
              >
                <option value="">Select Department</option>
                <option value="Computer">💻 Computer</option>
                <option value="IT">🖥️ IT</option>
                <option value="Civil">🏗️ Civil</option>
                <option value="ENTC">📡 ENTC</option>
              </select>

              <CustomFileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt"
                disabled={isUploading}
              />

              <motion.button
                type="submit"
                whileHover={{ scale: isUploading ? 1 : 1.05 }}
                whileTap={{ scale: isUploading ? 1 : 0.95 }}
                className={`w-full py-3 rounded-lg font-bold transition ${
                  isUploading || !formData.file
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
                disabled={isUploading || !formData.file}
              >
                {isUploading ? "Uploading..." : "Upload Note"}
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
          </>
        )}

        {/* Display notes (only if user is authenticated) */}
        {user && (
          <div className="mt-10">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
              Your Uploaded Notes
            </h3>
            {userNotes.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">
                No notes uploaded yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {userNotes.map((note) => (
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
                      onClick={() => {
                        window.open(
                          `https://edudesk.onrender.com/api/files/download/${note.id}`,
                          "_blank"
                        );
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-colors"
                      title="Download file"
                    >
                      📥 Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default UploadForm;
