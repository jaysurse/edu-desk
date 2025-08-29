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

const Navbar = ({
  onLoginClick,
  user,
  onLogoutClick,
  darkMode,
  onToggleTheme,
  selectedDept,
  setSelectedDept, // 👈 Add this prop
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
  }, [menuOpen]);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "Notes", href: "#notes" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
    {
      name: "Upload",
      href: "#upload",
      icon: <FaUpload className="inline ml-1" />,
    },
  ];

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
                className="hover:text-blue-600 transition-all flex items-center gap-1"
              >
                {link.name} {link.icon}
              </a>
            </li>
          ))}

          {/* 👇 Department Filter - Desktop */}
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
              <li className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                <FaUserCircle /> Hello, {user.displayName || user.email}
              </li>
              <li>
                <button
                  onClick={onLogoutClick}
                  className="hover:text-red-600 transition flex items-center gap-1"
                >
                  <FaSignOutAlt /> Log out
                </button>
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
                  className="hover:text-blue-600 transition flex items-center gap-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.name} {link.icon}
                </a>
              </li>
            ))}

            {/* 👇 Department Filter - Mobile */}
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
                <li className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                  <FaUserCircle /> Hello, {user.displayName || user.email}
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
            {darkMode ? <FaMoon /> : <FaSun />}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
