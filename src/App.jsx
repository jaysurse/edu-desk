import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HeroSection from "./components/Hero";
import Features from "./components/Feature";
import NotesPreview from "./components/Notesp";
import About from "./components/About";
import UploadForm from "./components/UploadF";
import Contact from "./components/Contact";
import AuthForm from "./components/AuthForm";
import Footer from "./components/Footer";

function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [user, setUser] = useState(
    () => localStorage.getItem("eduUser") || null
  );
  const [showLogin, setShowLogin] = useState(false);

  // Show login popup after 5 sec if no user
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowLogin(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const [notes, setNotes] = useState(() => {
    return JSON.parse(localStorage.getItem("notes")) || [];
  });

  const [selectedDept, setSelectedDept] = useState("All");

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

  // Dark mode toggle persistence
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Handle login
  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem("eduUser", username);
    setShowLogin(false);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("eduUser");
  };

  // Handle closing auth modal
  const handleCloseAuth = () => {
    setShowLogin(false);
    if (!user) {
      setTimeout(() => {
        setShowLogin(true);
      }, 5000);
    }
  };

  return (
    <>
      <Navbar
        onLoginClick={() => setShowLogin(true)}
        user={user}
        onLogoutClick={handleLogout}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
      />

      {showLogin && (
        <AuthForm onLogin={handleLogin} onClose={handleCloseAuth} />
      )}

      {/* Sections */}
      <div id="home">
        <HeroSection onLoginClick={() => setShowLogin(true)} />
      </div>
      <div id="features">
        <Features />
      </div>
      <div id="notes">
        <NotesPreview
          notes={notes}
          deleteNote={deleteNote}
          selectedDept={selectedDept}
        />
      </div>
      <div id="about">
        <About />
      </div>
      <div id="upload">
        <UploadForm notes={notes} addNote={addNote} user={user} />
      </div>
      <div id="contact">
        <Contact />
        <Footer />
      </div>
    </>
  );
}

export default App;
