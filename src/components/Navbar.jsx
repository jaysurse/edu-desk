import { useState, useEffect } from "react";
import {
  FaSun,
  FaMoon,
  FaUserCircle,
  FaSignOutAlt,
  FaUpload,
  FaFilter,
} from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import ProfileModal from "./ProfileModal";

const Navbar = ({
  onLoginClick,
  user,
  onLogoutClick,
  darkMode,
  onToggleTheme,
  selectedDept,
  setSelectedDept,
  activeSection,
  setActiveSection,
  API_BASE,
  notes,
  deleteNote,
  downloadNote,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("profile");

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
  }, [menuOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const profileDropdown = document.querySelector(".profile-dropdown-container");
      if (profileDropdown && !profileDropdown.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const navLinks = [
    { name: "Home", href: "#home", requiresAuth: false },
    { name: "Features", href: "#features", requiresAuth: false },
    { name: "Notes", href: "#notes", requiresAuth: false },
    { name: "About", href: "#about", requiresAuth: false },
    { name: "Contact", href: "#contact", requiresAuth: false },
    {
      name: "Upload",
      href: "#upload",
      icon: <FaUpload className="inline ml-1" />,
      requiresAuth: false,
    },
  ];

  // Handle navigation with auth check
  const handleNavClick = (e, link) => {
    if (link.requiresAuth && !user) {
      e.preventDefault();
      onLoginClick();
      return;
    }
    
    // If it's a profile link, set activeSection instead of scrolling
    if (link.name === "Profile") {
      e.preventDefault();
      setActiveSection("profile");
      return;
    }
    
    setMenuOpen(false);
    // Smooth scroll to section
    setTimeout(() => {
      const section = document.querySelector(link.href);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Helper function to get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    
    // Handle different user object structures
    if (typeof user === 'string') return user;
    
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  // Helper function to render user avatar
  const renderUserAvatar = (className = "w-8 h-8") => {
    if (user?.photoURL) {
      return (
        <img
          src={user.photoURL}
          alt="Profile"
          className={`${className} rounded-full object-cover border-2 border-blue-500`}
        />
      );
    }
    return <FaUserCircle className={`${className} text-blue-600 dark:text-blue-400`} />;
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md fixed w-full top-0 z-50 transition-colors duration-300">
      <div className="w-full px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Edu<span className="text-gray-800 dark:text-white">Desk 📚</span>
        </div>

        {/* Desktop Nav Links + Filter */}
        <ul className="hidden md:flex gap-6 text-gray-700 dark:text-gray-200 font-medium items-center transition-all">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className="hover:text-blue-600 transition-all flex items-center gap-1 cursor-pointer"
                title={link.requiresAuth && !user ? "Sign in required" : ""}
              >
                {link.name} {link.icon}
                {link.requiresAuth && !user && (
                  <span className="text-xs text-gray-400 ml-1">🔒</span>
                )}
              </a>
            </li>
          ))}

          {/* Department Filter - Desktop */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              // Scroll to Notes section
              const notesSection = document.getElementById("notes");
              if (notesSection) {
                notesSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
          >
            <option value="All">🏢 All Departments</option>
            <option value="Computer">💻 Computer</option>
            <option value="IT">🖥️ IT</option>
            <option value="Civil">🏗️ Civil</option>
            <option value="ENTC">📡 ENTC</option>
          </select>

          {user ? (
            <>
              <li className="relative profile-dropdown-container">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={getUserDisplayName()}
                >
                  {renderUserAvatar("w-8 h-8")}
                  <span className="hidden lg:block text-gray-800 dark:text-white font-semibold">{getUserDisplayName()}</span>
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3">
                      {renderUserAvatar("w-10 h-10")}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{getUserDisplayName()}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1 p-2">
                      <button
                        onClick={() => {
                          setActiveProfileTab("profile");
                          setShowProfileModal(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                      >
                        👤 My Profile
                      </button>
                      <button
                        onClick={() => {
                          setActiveProfileTab("dashboard");
                          setShowProfileModal(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                      >
                        📊 My Dashboard
                      </button>
                      <button
                        onClick={() => {
                          setActiveProfileTab("analytics");
                          setShowProfileModal(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                      >
                        📈 My Analytics
                      </button>
                      <button
                        onClick={() => {
                          setActiveProfileTab("shared");
                          setShowProfileModal(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                      >
                        📝 My Shared Notes
                      </button>
                      <button
                        onClick={() => {
                          setActiveProfileTab("likes");
                          setShowProfileModal(true);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-sm"
                      >
                        ❤️ My Likes
                      </button>
                    </div>
                    <div className="p-2 border-t dark:border-gray-700">
                      <button
                        onClick={() => {
                          onLogoutClick();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded flex items-center gap-2 text-sm"
                      >
                        <FaSignOutAlt /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={onLoginClick}
                className="hover:text-blue-600 transition focus:outline-none"
              >
                Log in / Sign up
              </button>
            </li>
          )}
        </ul>

        {/* Dark Mode Toggle (Desktop) */}
        <button
          onClick={onToggleTheme}
          className="hidden md:block text-gray-600 dark:text-gray-300 hover:text-blue-600 text-2xl transition-all duration-300"
          title="Toggle Theme"
        >
          {darkMode ? <FaMoon /> : <FaSun />}
        </button>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 dark:text-gray-300 focus:outline-none text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <IoMdClose /> : <GiHamburgerMenu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 bg-white dark:bg-gray-900 shadow-md animate-fade-in-down">
          <ul className="flex flex-col gap-4 text-gray-700 dark:text-gray-200 font-medium transition-all duration-300">
            {navLinks.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className="hover:text-blue-600 transition flex items-center gap-1 cursor-pointer"
                  title={link.requiresAuth && !user ? "Sign in required" : ""}
                >
                  {link.name} {link.icon}
                  {link.requiresAuth && !user && (
                    <span className="text-xs text-gray-400 ml-1">🔒</span>
                  )}
                </a>
              </li>
            ))}

            {/* Department Filter - Mobile */}
            <li className="flex items-center gap-2">
              <FaFilter className="text-gray-500 dark:text-gray-300" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white"
              >
                <option value="All">All</option>
                <option value="Computer">Computer</option>
                <option value="IT">IT</option>
                <option value="ENTC">ENTC</option>
                <option value="Civil">Civil</option>
              </select>
            </li>

            {user ? (
              <>
                <li className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-3 py-2">
                  {renderUserAvatar()}
                  <span>Hello, {getUserDisplayName()}</span>
                </li>
                <li>
                  <button
                    onClick={() => {
                      onLogoutClick();
                      setMenuOpen(false);
                    }}
                    className="hover:text-red-600 transition flex items-center gap-1"
                  >
                    <FaSignOutAlt /> Log out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <button
                  onClick={() => {
                    onLoginClick();
                    setMenuOpen(false);
                  }}
                  className="hover:text-blue-600 transition focus:outline-none"
                >
                  Log in / Sign up
                </button>
              </li>
            )}
          </ul>

          {/* Dark Mode Toggle (Mobile) */}
          <button
            onClick={onToggleTheme}
            className="mt-4 block text-gray-600 dark:text-gray-300 hover:text-blue-600 text-xl"
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        API_BASE={API_BASE}
        notes={notes}
        deleteNote={deleteNote}
        downloadNote={downloadNote}
      />
    </nav>
  );
};

export default Navbar;
