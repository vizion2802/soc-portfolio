// =========================
// ADMIN PANEL — admin.js v2
// =========================
//
// SECURITY NOTES (READ BEFORE EDITING):
// ─────────────────────────────────────
// ⚠️  Storing a real password in client-side JS is NEVER safe.
//    Anyone can open DevTools and read it.
//
// This version uses a SHA-256 hash of the password instead of plaintext.
// This does NOT make it server-secure, but it:
//   1. Hides the password from casual inspection.
//   2. Makes the code easy to swap for a real backend auth call.
//
// To generate your own hash:
//   Open browser console and run:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('YourPassword'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
//
// Replace ADMIN_HASH below with your own hash.
// Default password for demo: S0c@l3rt#2026!
// ─────────────────────────────────────

console.log("ADMIN PANEL CONNECTED ✅");

// SHA-256 hash of "S0c@l3rt#2026!" — replace with your own!
const ADMIN_HASH =
  "d329574f747890c4b6d489aa1a32669bb10ba4ba54190919daaafe2a79bfb3e3";
//  ↑ This is a placeholder. Run the snippet above to get your real hash.

let attempts = 0;
const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 10;
const LOCK_MS = LOCK_MINUTES * 60 * 1000;

// =========================
// HASH HELPER (Web Crypto)
// =========================
async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buf)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// =========================
// LOGIN
// =========================
async function checkPassword() {
  const input = document.getElementById("password").value;
  const error = document.getElementById("loginError");
  const btn   = document.getElementById("loginBtn");

  // Lock check
  const lockUntil = localStorage.getItem("adminLockUntil");
  if (lockUntil && Date.now() < Number(lockUntil)) {
    const remaining = Math.ceil((Number(lockUntil) - Date.now()) / 1000);
    error.textContent = `🔒 Locked. Try again in ${remaining}s`;
    return;
  }

  // Basic format guard (client-side UX only — not a security measure)
  if (!validatePasswordFormat(input)) {
    error.textContent = "Use 12+ chars with A–Z, a–z, 0–9, and a symbol.";
    return;
  }

  // Disable button while hashing
  btn.disabled = true;
  btn.textContent = "Checking…";

  const hash = await sha256(input);

  btn.disabled = false;
  btn.textContent = "Login";

  if (hash === ADMIN_HASH) {
    attempts = 0;
    localStorage.removeItem("adminLockUntil");
    sessionStorage.setItem("adminAuth", "true");
    showPanel();
  } else {
    attempts++;
    error.textContent = `❌ Wrong password (${attempts}/${MAX_ATTEMPTS})`;

    if (attempts >= MAX_ATTEMPTS) {
      const blockUntil = Date.now() + LOCK_MS;
      localStorage.setItem("adminLockUntil", String(blockUntil));
      error.textContent = `🚨 Too many attempts. Locked for ${LOCK_MINUTES} minutes.`;
    }
  }
}

// =========================
// PASSWORD FORMAT RULES
// =========================
function validatePasswordFormat(pw) {
  return (
    pw.length >= 12 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(pw)
  );
}

// =========================
// SHOW / HIDE PANEL
// =========================
function showPanel() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("adminPanel").style.display = "block";
  loadAdminPosts();
}

// =========================
// AUTO LOGIN CHECK
// =========================
window.onload = function () {
  const lockUntil = localStorage.getItem("adminLockUntil");
  if (lockUntil && Date.now() < Number(lockUntil)) {
    const remaining = Math.ceil((Number(lockUntil) - Date.now()) / 1000);
    const error = document.getElementById("loginError");
    if (error) error.textContent = `🔒 Locked. Try again in ${remaining}s`;
    return;
  }

  if (sessionStorage.getItem("adminAuth") === "true") {
    showPanel();
  }
};

// =========================
// LOGOUT
// =========================
function lockPanel() {
  sessionStorage.removeItem("adminAuth");
  location.reload();
}

// =========================
// PUBLISH BLOG POST
// =========================
function publishPost() {
  const title   = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const msg     = document.getElementById("publishMsg");

  if (!title || !content) {
    msg.style.color = "#ff3b3b";
    msg.textContent = "⚠️ Title and content are required.";
    msg.style.display = "block";
    return;
  }

  if (typeof addBlogPost !== "function") {
    console.error("blog.js not loaded — addBlogPost unavailable");
    return;
  }

  addBlogPost(title, content, "General");
  clearForm();
  loadAdminPosts();

  msg.style.color = "#39ff5a";
  msg.textContent = "✅ Post published successfully";
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 3000);
}

// =========================
// CLEAR FORM
// =========================
function clearForm() {
  document.getElementById("title").value   = "";
  document.getElementById("content").value = "";
}

// =========================
// LOAD ADMIN POSTS LIST
// =========================
function loadAdminPosts() {
  const container = document.getElementById("adminPosts");
  if (!container) return;

  const posts = getAllPosts();

  if (posts.length === 0) {
    container.innerHTML = `<p style="color:var(--text-dim);font-size:12px;">No posts yet.</p>`;
    return;
  }

  // Build safely with DOM — no innerHTML with user data
  container.innerHTML = "";
  posts.forEach(post => {
    const wrap = document.createElement("div");
    wrap.className = "admin-post";

    const h3 = document.createElement("h3");
    h3.textContent = post.title;

    const meta = document.createElement("small");
    meta.textContent = `${post.category} | ${post.date}`;

    const excerpt = document.createElement("p");
    excerpt.textContent = post.content.substring(0, 120) + "…";

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = () => {
      if (confirm(`Delete "${post.title}"?`)) {
        deletePost(post.id);
        loadAdminPosts();
      }
    };

    wrap.append(h3, meta, excerpt, del);
    container.appendChild(wrap);
  });
}

// =========================
// TERMINAL COMMANDS (admin.html)
// =========================
function runCmd(e) {
  if (e.key !== "Enter") return;
  const cmd  = e.target.value.trim();
  const term = document.getElementById("terminal");

  const line = document.createElement("p");

  // Sanitize output — use textContent, not innerHTML, for user input
  if (cmd === "status") {
    line.innerHTML = `<span class="green">System Running OK</span>`;
  } else if (cmd === "logs") {
    line.innerHTML = `<span class="amber">No logs to display in demo mode.</span>`;
  } else if (cmd === "help") {
    line.innerHTML = `Commands: status, logs, help`;
  } else {
    // Use textContent so user input can't inject HTML
    line.className = "red";
    line.textContent = `Command not found: ${cmd}`;
  }

  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
  e.target.value = "";
}

function addProject() {
  const p = document.getElementById("project").value.trim();
  const d = document.getElementById("desc").value.trim();
  if (!p || !d) return;

  const log  = document.getElementById("projectLog");
  const item = document.createElement("p");
  item.textContent = `[PROJECT] ${p} — updated`; // textContent, not innerHTML
  log.appendChild(item);

  document.getElementById("project").value = "";
  document.getElementById("desc").value    = "";
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadAdminPosts();
});