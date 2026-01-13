/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import Navbar from "./components/Navbar";
import HeroSection from "./components/Hero";
import Features from "./components/Feature";
import NotesPreview from "./components/Notesp";
import About from "./components/About";
import UploadForm from "./components/UploadF";
import AuthForm from "./components/AuthForm";
import Footer from "./components/Footer";
import { doSignOut } from "./firebase/auth";

// Use localhost:10000 for development, production URL for deployed app
const API_BASE = import.meta.env.DEV 
  ? "http://localhost:10000" 
  : "https://edudesk.onrender.com";

function App() {
  // UI State
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [showLogin, setShowLogin] = useState(false);
  const [selectedDept, setSelectedDept] = useState("All");

  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data State
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // Use ref to prevent infinite loops
  const fetchNotesRef = useRef();

  // Theme toggle function 
  const onToggleTheme = () => {
    console.log("Theme toggle clicked! Current darkMode:", darkMode);
    setDarkMode(prev => {
      console.log("Setting darkMode from", prev, "to", !prev);
      return !prev;
    });
  };

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      // Sync localStorage with Firebase auth state
      if (currentUser) {
        const userData = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        };
        localStorage.setItem("eduUser", JSON.stringify(userData));
      } else {
        localStorage.removeItem("eduUser");
      }
    });

    return () => unsubscribe();
  }, []);

  // Define fetchNotes function using ref to avoid dependency issues
  fetchNotesRef.current = async () => {
    setNotesLoading(true);
    try {

      const headers = {
        'Content-Type': 'application/json'
      };

      if (user) {
        try {
          const idToken = await user.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (tokenError) {
          console.warn('Failed to get auth token:', tokenError);
        }
      }

      const response = await fetch(`${API_BASE}/api/files/notes`, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        const notesArray = data.files || data.notes || [];
        setNotes(notesArray);
        console.log('Notes fetched successfully:', {
          count: notesArray.length,
          authenticated: data.user_authenticated || false
        });
      } else {
        const error = await response.json();
        console.error('Failed to fetch notes:', error);
        setNotes([]);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  // Fetch notes when auth state is resolved
  useEffect(() => {
    if (!authLoading) {
      fetchNotesRef.current();
    }
  }, [authLoading]);

  // Fetch notes when user changes (login/logout)
  useEffect(() => {
    if (!authLoading) {
      fetchNotesRef.current();
    }
  }, [user]);

  // Replace your existing dark mode useEffect with this:
useEffect(() => {
  console.log("Dark mode effect triggered. darkMode:", darkMode);
  if (darkMode) {
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    console.log("Applied dark mode classes and saved to localStorage");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
    console.log("Removed dark mode classes and saved light to localStorage");
  }
}, [darkMode]);

  const addNote = async (note) => {
    setNotes(prev => [note, ...prev]);
    
    // Refresh notes from API to ensure consistency
    await fetchNotesRef.current();
  };

  // Delete note function
  const deleteNote = async (id) => {
    try {
      if (!user) {
        alert("Please sign in to delete notes.");
        return;
      }

      if (!window.confirm("Are you sure you want to delete this note?")) {
        return;
      }

      console.log('Attempting to delete note:', id);

      const idToken = await user.getIdToken(true);

      const response = await fetch(`${API_BASE}/api/files/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Refresh notes from API after successful deletion
        await fetchNotesRef.current();
        alert('Note deleted successfully!');
      } else {
        handleDeleteError(result);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Network error: ' + error.message);
    }
  };

  // Helper function to handle delete errors
  const handleDeleteError = (result) => {
    console.error('Delete failed:', result);
    
    switch (result.code) {
      case 'UNAUTHORIZED_DELETE':
        alert('You can only delete your own notes.');
        break;
      case 'INVALID_TOKEN':
      case 'NO_TOKEN':
        alert('Please sign in again to delete notes.');
        break;
      case 'FILE_NOT_FOUND':
        alert('Note not found or already deleted.');
        break;
      default:
        alert(result.error || 'Failed to delete note');
    }
  };

  // Download note function
  const downloadNote = async (id, filename) => {
    try {      const response = await fetch(`${API_BASE}/api/files/download/${id}`, {

        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `note_${id}`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Download started successfully');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to download file');
      }
    } catch (error) {
      alert('Network error: ' + error.message);
    }
  };

  // Auth handlers
  const handleLogin = () => {
    setShowLogin(false);
  };

  const handleLogout = async () => {
    try {
      await doSignOut();
      console.log("User successfully logged out");
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: manually clear state
      setUser(null);
      localStorage.removeItem("eduUser");
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Checking authentication...
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Navbar */}
        

      <Navbar
        onLoginClick={() => setShowLogin(true)} 
        user={user} 
        onLogoutClick={handleLogout}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}  
        selectedDept={selectedDept}
        setSelectedDept={setSelectedDept}
      />

      {/* Auth Modal */}
      {showLogin && (
        <AuthForm 
          onLogin={handleLogin} 
          onClose={() => setShowLogin(false)} 
        />
      )}

      {/* Main Content */}
      <div id="home">
        <HeroSection 
          onLoginClick={() => setShowLogin(true)} 
          user={user} 
        />
      </div>
      
      <div id="features">
        <Features />
      </div>
      
      <div id="notes">
        <NotesPreview
          notes={notes}
          deleteNote={deleteNote}
          downloadNote={downloadNote}
          selectedDept={selectedDept}
          user={user}
          loading={notesLoading}
        />
      </div>

      <div id="upload">
        <UploadForm 
          notes={notes} 
          addNote={addNote} 
          user={user}
          onLoginClick={() => setShowLogin(true)}
        />
      </div>
      
      <div id="about">
        <About />
      </div>
      
      <div id="contact">
        <Footer />
      </div>
    </>
  );
}

export default App;
