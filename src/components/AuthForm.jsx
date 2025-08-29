import { useState } from "react";
import {
  FaUserCircle,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { auth, googleProvider } from "../firebase"; // adjust path if needed
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const AuthForm = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;

  // 🔹 Real Firebase Authentication
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (!isLogin) {
      if (!displayName.trim()) {
        setError("Display name is required.");
        setLoading(false);
        return;
      }

      if (!doPasswordsMatch) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // 🔑 Sign in existing user
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("✅ Login successful:", userCredential.user);
        onLogin(userCredential.user);
      } else {
        // 🆕 Create new user account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Update the user's display name
        await updateProfile(userCredential.user, {
          displayName: displayName.trim(),
        });

        console.log("✅ Account created:", userCredential.user);
        onLogin(userCredential.user);
      }
    } catch (err) {
      console.error("Authentication error:", err);

      // Handle specific Firebase auth errors with user-friendly messages
      switch (err.code) {
        case "auth/user-not-found":
          setError(
            "🔍 No account found with this email. Would you like to create an account instead?"
          );
          break;
        case "auth/wrong-password":
          setError(
            "🔐 Incorrect password. Please check your password and try again."
          );
          break;
        case "auth/invalid-credential":
          setError(
            "❌ Invalid email or password. Please check your credentials and try again."
          );
          break;
        case "auth/email-already-in-use":
          setError(
            "📧 This email is already registered. Try signing in instead."
          );
          break;
        case "auth/weak-password":
          setError(
            "🔒 Password is too weak. Please use at least 6 characters with numbers and letters."
          );
          break;
        case "auth/invalid-email":
          setError(
            "📧 Please enter a valid email address (example: user@email.com)."
          );
          break;
        case "auth/too-many-requests":
          setError(
            "⏰ Too many failed attempts. Please wait a few minutes before trying again."
          );
          break;
        case "auth/network-request-failed":
          setError(
            "🌐 Network error. Please check your internet connection and try again."
          );
          break;
        case "auth/user-disabled":
          setError(
            "🚫 This account has been disabled. Please contact support for help."
          );
          break;
        case "auth/requires-recent-login":
          setError("🔄 Please log out and sign in again to continue.");
          break;
        default:
          setError(
            `⚠️ Something went wrong. Please try again or contact support if the problem persists.`
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("✅ Google login successful:", user);
      onLogin(user);
    } catch (err) {
      console.error("Google Sign-In error:", err);

      // Handle specific Google auth errors with user-friendly messages
      switch (err.code) {
        case "auth/popup-closed-by-user":
          setError(
            "🚪 Sign-in window was closed. Please try again to continue with Google."
          );
          break;
        case "auth/popup-blocked":
          setError(
            "🚫 Pop-up was blocked by your browser. Please allow pop-ups for this site and try again."
          );
          break;
        case "auth/account-exists-with-different-credential":
          setError(
            "📧 An account with this email already exists using a different sign-in method. Try signing in with email/password instead."
          );
          break;
        case "auth/cancelled-popup-request":
          setError(
            "⏰ Previous sign-in attempt was cancelled. Please try again."
          );
          break;
        case "auth/network-request-failed":
          setError(
            "🌐 Network error. Please check your internet connection and try again."
          );
          break;
        default:
          setError(
            "🔴 Google Sign-In failed. Please try again or use email/password instead."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setDisplayName("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleCloseAuth = () => {
    setShowLogin(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        className="bg-white/15 dark:bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/30 dark:border-gray-600 animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          aria-label="Close dialog"
          disabled={loading}
        >
          <FaTimes />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6 text-blue-400 text-5xl">
          <FaUserCircle />
        </div>

        {/* Title */}
        <h2
          id="auth-title"
          className="text-2xl font-bold text-center text-white mb-6"
        >
          {isLogin ? "Welcome Back!" : "Create Account"}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Display Name Field (Sign Up only) */}
          {!isLogin && (
            <div className="relative">
              <label htmlFor="displayName" className="sr-only">
                Full Name
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Enter your full name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/25 transition-all duration-200 border border-transparent focus:border-blue-400/50"
                disabled={loading}
                autoComplete="name"
                required={!isLogin}
              />
            </div>
          )}

          {/* Email Field */}
          <div className="relative">
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/25 transition-all duration-200 border border-transparent focus:border-blue-400/50"
              disabled={loading}
              autoComplete="email"
              required
            />
            {/* Email validation indicator */}
            {email && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isEmailValid ? (
                  <FaCheck className="text-green-400 text-sm" />
                ) : (
                  <FaTimes className="text-red-400 text-sm" />
                )}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 pr-12 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/25 transition-all duration-200 border border-transparent focus:border-blue-400/50"
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password validation indicator for signup */}
          {!isLogin && password && (
            <div className="text-sm space-y-1">
              <div
                className={`flex items-center ${
                  isPasswordValid ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPasswordValid ? (
                  <FaCheck className="mr-2 text-xs" />
                ) : (
                  <FaTimes className="mr-2 text-xs" />
                )}
                At least 6 characters
              </div>
              {email && (
                <div
                  className={`flex items-center ${
                    isEmailValid ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {isEmailValid ? (
                    <FaCheck className="mr-2 text-xs" />
                  ) : (
                    <FaTimes className="mr-2 text-xs" />
                  )}
                  Valid email address
                </div>
              )}
            </div>
          )}

          {/* Confirm Password Field (Sign Up only) */}
          {!isLogin && (
            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 pr-12 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/25 transition-all duration-200 border border-transparent focus:border-blue-400/50"
                disabled={loading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                disabled={loading}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          )}

          {/* Password match indicator */}
          {!isLogin && confirmPassword && (
            <div className="text-sm">
              <div
                className={`flex items-center ${
                  doPasswordsMatch ? "text-green-400" : "text-red-400"
                }`}
              >
                {doPasswordsMatch ? (
                  <FaCheck className="mr-2" />
                ) : (
                  <FaTimes className="mr-2" />
                )}
                Passwords {doPasswordsMatch ? "match" : "do not match"}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm leading-relaxed">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !isEmailValid ||
              !isPasswordValid ||
              (!isLogin && (!doPasswordsMatch || !displayName.trim()))
            }
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-white/30"></div>
          <span className="text-white/80 text-sm px-4 font-medium">OR</span>
          <div className="flex-1 h-px bg-white/30"></div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center bg-white hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold transform hover:-translate-y-0.5 disabled:transform-none"
        >
          <FcGoogle className="text-xl mr-3" />
          {loading ? "Please wait..." : "Continue with Google"}
        </button>

        {/* Toggle Login/Signup */}
        <div className="text-center mt-6">
          <p className="text-white/90 text-sm">
            {isLogin ? "New to our platform?" : "Already have an account?"}
          </p>
          <button
            onClick={toggleMode}
            className="text-blue-300 hover:text-blue-200 font-semibold hover:underline transition-colors mt-1"
            type="button"
            disabled={loading}
          >
            {isLogin ? "Create an account" : "Sign in instead"}
          </button>
        </div>

        {/* Additional Help */}
        {isLogin && (
          <div className="text-center mt-4">
            <button
              type="button"
              className="text-white/70 hover:text-white text-sm hover:underline transition-colors"
              onClick={() =>
                alert("Password reset functionality would be implemented here")
              }
              disabled={loading}
            >
              Forgot your password?
            </button>
          </div>
        )}
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AuthForm;
