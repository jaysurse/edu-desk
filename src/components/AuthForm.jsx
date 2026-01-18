import { useState, useEffect, useRef } from "react";
import {
  FaUserCircle,
  FaGoogle,
  FaEye,
  FaEyeSlash,
  FaTimes,
} from "react-icons/fa";
import {
  doCreateUserWithEmailAndPassword,
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
  doSendEmailVerification,
} from "../firebase/auth";

const AuthForm = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  // Focus management for accessibility
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isLogin]);

  // Keyboard event handling
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleTab = (e) => {
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [onClose]);

  // Input sanitization
  const sanitizeEmail = (input) => {
    return input.trim().toLowerCase();
  };

  const sanitizePassword = (input) => {
    return input.trim();
  };

  // Real-time email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Real-time password validation
  const validatePassword = (password, isSignup = false) => {
    if (!password) {
      setPasswordError("");
      return false;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }

    if (isSignup) {
      // Additional checks for signup
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar))) {
        setPasswordError(
          "Password should contain uppercase, lowercase, and numbers or special characters"
        );
        return false;
      }
    }

    setPasswordError("");
    return true;
  };

  // Rate limiting
  const checkRateLimit = () => {
    if (attemptCount >= 5) {
      setIsBlocked(true);
      setError(
        "Too many failed attempts. Please wait 5 minutes before trying again."
      );
      setTimeout(() => {
        setIsBlocked(false);
        setAttemptCount(0);
      }, 300000); // 5 minutes
      return false;
    }
    return true;
  };

  // Resend verification email
  const handleResendVerification = async () => {
    try {
      await doSendEmailVerification();
      setError("");
      alert("Verification email resent! Please check your inbox.");
    } catch (setError) {
      setError("Failed to resend verification email. Please try again.");
    }
  };

  const handleEmailAuth = async () => {
    if (isBlocked || !checkRateLimit()) return;

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPassword = sanitizePassword(password);

    // Validation
    if (!sanitizedEmail || !sanitizedPassword) {
      setError("Email and password are required");
      return;
    }

    if (
      !validateEmail(sanitizedEmail) ||
      !validatePassword(sanitizedPassword, !isLogin)
    ) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let userCredential;

      if (isLogin) {
        userCredential = await doSignInWithEmailAndPassword(
          sanitizedEmail,
          sanitizedPassword
        );

        if (userCredential.user.emailVerified) {
          setError(
            "Please verify your email before logging in. Check your inbox for the verification link."
          );
          setIsLoading(false);
          return;
        }
      } else {
        userCredential = await doCreateUserWithEmailAndPassword(
          sanitizedEmail,
          sanitizedPassword
        );

        try {
          await doSendEmailVerification();
          setVerificationSent(true);
          setError("");
          setIsLoading(false);
          return;
        } catch (verificationError) {
          // Log only error code for security
          console.error("Verification email error:", verificationError.code);
          setError(
            "Account created, but verification email failed to send. Please try logging in and request verification again."
          );
        }
      }

      const user = userCredential.user;
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || sanitizedEmail.split("@")[0],
        photoURL: user.photoURL,
        loginMethod: "email",
        emailVerified: user.emailVerified,
      };

      // Reset attempt count on success
      setAttemptCount(0);
      onLogin(userData);
      onClose();
    } catch (error) {
      // Increment attempt count
      setAttemptCount((prev) => prev + 1);

      // Log only error code for security
      console.error("Authentication error code:", error.code);

      // Handle specific Firebase error codes
      const errorMessages = {
        "auth/user-not-found":
          "No account found with this email. Please sign up first.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/user-disabled":
          "This account has been disabled. Please contact support.",
        "auth/invalid-credential":
          "Invalid credentials. Please check your email and password.",
        "auth/email-already-in-use":
          "An account with this email already exists. Please log in instead.",
        "auth/weak-password": "Password should be at least 6 characters long.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests":
          "Too many failed attempts. Please try again later.",
        "auth/network-request-failed":
          "Network error. Please check your connection and try again.",
        "auth/operation-not-allowed":
          "This authentication method is not enabled. Please contact support.",
      };

      setError(
        errorMessages[error.code] || "Authentication failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isBlocked || !checkRateLimit()) return;

    setIsGoogleLoading(true);
    setError("");

    try {
      const result = await doSignInWithGoogle();
      const user = result.user;

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        loginMethod: "google",
        emailVerified: user.emailVerified,
      };

      // Reset attempt count on success
      setAttemptCount(0);
      onLogin(userData);
      onClose();
    } catch (error) {
      // Increment attempt count
      setAttemptCount((prev) => prev + 1);

      // Log only error code
      console.error("Google login error code:", error.code);

      const errorMessages = {
        "auth/popup-closed-by-user": "Login was cancelled. Please try again.",
        "auth/popup-blocked":
          "Popup was blocked. Please allow popups and try again.",
        "auth/cancelled-popup-request":
          "Login request was cancelled. Please try again.",
        "auth/network-request-failed":
          "Network error. Please check your connection and try again.",
      };

      setError(
        errorMessages[error.code] || "Google login failed. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError("");
    setEmail("");
    setPassword("");
    setVerificationSent(false);
    setEmailError("");
    setPasswordError("");
    setShowPassword(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading && !isGoogleLoading) {
      handleEmailAuth();
    }
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
        ref={modalRef}
        className="bg-white/10 dark:bg-gray-800/40 backdrop-blur-lg p-6 rounded-xl shadow-xl w-full max-w-sm border border-white/20 dark:border-gray-700 animate-fadeInScale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="float-right text-white hover:text-red-400 text-2xl font-bold transition-colors duration-200"
          aria-label="Close authentication dialog"
          type="button"
        >
          <FaTimes />
        </button>

        <div
          className="flex justify-center mb-4 text-blue-500 text-4xl"
          aria-hidden="true"
        >
          <FaUserCircle />
        </div>

        <h2
          id="auth-title"
          className="text-2xl font-semibold text-center text-white mb-6"
        >
          {isLogin ? "Log In" : "Sign Up"}
        </h2>

        {/* Verification message */}
        {verificationSent && (
          <div
            className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-md"
            role="alert"
          >
            <p className="text-green-300 text-sm mb-2">
              Verification email sent! Please check your inbox and verify your
              email before logging in.
            </p>
            <button
              onClick={handleResendVerification}
              className="text-green-200 underline text-xs hover:text-green-100 transition-colors"
              type="button"
            >
              Didn't receive the email? Resend verification
            </button>
          </div>
        )}

        {/* Rate limiting warning */}
        {attemptCount >= 3 && !isBlocked && (
          <div
            className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-md"
            role="alert"
          >
            <p className="text-yellow-300 text-sm">
              Warning: {5 - attemptCount} attempts remaining before temporary
              lockout.
            </p>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading || isBlocked}
          className="w-full bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center space-x-3 mb-4 disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-describedby={isGoogleLoading ? "google-loading" : undefined}
          type="button"
        >
          {isGoogleLoading ? (
            <div
              className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"
              aria-hidden="true"
            ></div>
          ) : (
            <FaGoogle className="text-red-500" aria-hidden="true" />
          )}
          <span id={isGoogleLoading ? "google-loading" : undefined}>
            {isGoogleLoading ? "Connecting..." : "Continue with Google"}
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center mb-4" aria-hidden="true">
          <div className="flex-grow border-t border-white/30"></div>
          <span className="px-4 text-white/70 text-sm">or</span>
          <div className="flex-grow border-t border-white/30"></div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEmailAuth();
          }}
          className="space-y-4"
        >
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <input
              ref={firstInputRef}
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                const sanitized = sanitizeEmail(e.target.value);
                setEmail(sanitized);
                validateEmail(sanitized);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isGoogleLoading || isBlocked}
              className="w-full px-4 py-3 rounded-md bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={emailError ? "true" : "false"}
              autoComplete="email"
              required
            />
            {emailError && (
              <p
                id="email-error"
                className="text-red-400 text-sm mt-1"
                role="alert"
              >
                {emailError}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  const sanitized = sanitizePassword(e.target.value);
                  setPassword(sanitized);
                  validatePassword(sanitized, !isLogin);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isGoogleLoading || isBlocked}
                className="w-full px-4 py-3 pr-12 rounded-md bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                aria-describedby={passwordError ? "password-error" : undefined}
                aria-invalid={passwordError ? "true" : "false"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading || isGoogleLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passwordError && (
              <p
                id="password-error"
                className="text-red-400 text-sm mt-1"
                role="alert"
              >
                {passwordError}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="text-red-400 text-sm p-3 bg-red-500/10 rounded-md border border-red-500/20"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isLoading ||
              isGoogleLoading ||
              isBlocked ||
              emailError ||
              passwordError
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition duration-200 font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby={isLoading ? "submit-loading" : undefined}
          >
            {isLoading && (
              <div
                className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"
                aria-hidden="true"
              ></div>
            )}
            <span id={isLoading ? "submit-loading" : undefined}>
              {isLoading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
            </span>
          </button>
        </form>

        <p className="text-center mt-6 text-white text-sm">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={handleModeSwitch}
            disabled={isLoading || isGoogleLoading || isBlocked}
            className="text-blue-300 ml-1 hover:underline disabled:opacity-50 focus:outline-none focus:underline transition-all duration-200"
            type="button"
            // disabled={loading}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>

        {/* Accessibility info */}
        <div className="sr-only">
          Press Escape to close this dialog. Use Tab to navigate between form
          elements.
        </div>
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
