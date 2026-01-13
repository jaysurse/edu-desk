// Simple local test script to sign up/sign in with Firebase Auth and upload a note
// Usage:
//   node scripts/test-upload.js
// Optional env overrides:
//   API_BASE=http://localhost:10000 FIREBASE_API_KEY=... TEST_EMAIL=... TEST_PASSWORD=...

const API_BASE = process.env.API_BASE || "http://localhost:10000";
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyDxhSUBbE0Si5TprCwlm-RPgNMINwuKBf4";
const TEST_EMAIL = process.env.TEST_EMAIL || "vivekjangam73@gmail.com.com";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "Vivek123";

async function firebaseSignInOrSignUp(email, password) {
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;

  // Try sign-in first
  const signInRes = await fetch(signInUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const signInData = await signInRes.json();
  if (signInRes.ok) {
    return signInData.idToken;
  }

  // If user not found, create it
  if (signInData.error && signInData.error.message === "EMAIL_NOT_FOUND") {
    const signUpRes = await fetch(signUpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    const signUpData = await signUpRes.json();
    if (!signUpRes.ok) {
      throw new Error(`Sign-up failed: ${signUpData.error?.message || signUpRes.status}`);
    }
    return signUpData.idToken;
  }

  throw new Error(`Sign-in failed: ${signInData.error?.message || signInRes.status}`);
}

async function uploadNote(idToken) {
  // Minimal PDF buffer
  const pdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

  const formData = new FormData();
  formData.append("title", "Local test note");
  formData.append("subject", "Test Subject");
  formData.append("uploader", "Local Tester");
  formData.append("department", "Computer");
  formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "sample.pdf");

  const res = await fetch(`${API_BASE}/api/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

(async () => {
  try {
    console.log("API_BASE:", API_BASE);
    console.log("Signing in/registering test user...", TEST_EMAIL);
    const idToken = await firebaseSignInOrSignUp(TEST_EMAIL, TEST_PASSWORD);
    console.log("Got ID token (truncated):", `${idToken.slice(0, 12)}...`);

    console.log("Uploading test note...");
    const result = await uploadNote(idToken);
    console.log("Upload success:", result);
  } catch (err) {
    console.error("Test failed:", err.message);
    process.exit(1);
  }
})();
