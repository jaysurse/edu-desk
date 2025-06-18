import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/Hero";
import Features from "./components/Feature";
import NotesPreview from "./components/Notesp";
import About from "./components/About";
import UploadForm from "./components/UploadF";
import Contact from "./components/Contact";
import AuthForm from "./components/AuthForm"; // ✅ properly imported

function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [user, setUser] = useState(
    () => localStorage.getItem("eduUser") || null
  );
  const [showLogin, setShowLogin] = useState(false);

  // Notes logic
  const [notes, setNotes] = useState(() => {
    return JSON.parse(localStorage.getItem("notes")) || [];
  });

  const addNote = (note) => {
    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem("notes", JSON.stringify(updatedNotes));
  };

  // Dark mode logic
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("eduUser", username);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("eduUser");
  };

  return (
    <>
      {/* Navbar */}
      <Navbar
        onLoginClick={() => setShowLogin(true)}
        user={user}
        onLogoutClick={handleLogout}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
      />

      {/* Auth Modal (styled and working) */}
      {showLogin && (
        <AuthForm onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}

      {/* Sections */}
      <div id="home">
        <HeroSection onLoginClick={() => setShowLogin(true)} />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="notes">
        <NotesPreview notes={notes} deleteNote={deleteNote} />
      </div>
      <div id="about">
        <About />
      </div>
      <div id="upload">
        <UploadForm notes={notes} addNote={addNote} user={user} />
      </div>
      <div id="contact">
        <Contact />
      </div>
    </>
  );
}

export default App;
