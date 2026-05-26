// =========================
// ADMIN PANEL — admin.js v4
// Supabase + SHA-256 login
// =========================

console.log("ADMIN PANEL CONNECTED ✅");

// SHA-256 hash of admin password
// To update: run in console:
// crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
//   .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
const ADMIN_HASH = "d329574f747890c4b6d489aa1a32669bb10ba4ba54190919daaafe2a79bfb3e3";

let attempts = 0;
const MAX_ATTEMPTS = 3;
const LOCK_MS = 10 * 60 * 1000;

// =========================
// HASH HELPER
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

  const lockUntil = localStorage.getItem("adminLockUntil");
  if (lockUntil && Date.now() < Number(lockUntil)) {
    const remaining = Math.ceil((Number(lockUntil) - Date.now()) / 1000);
    error.textContent = "🔒 Locked. Try again in " + remaining + "s";
    return;
  }

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
    error.textContent = "❌ Wrong password (" + attempts + "/" + MAX_ATTEMPTS + ")";
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem("adminLockUntil", String(Date.now() + LOCK_MS));
      error.textContent = "🚨 Too many attempts. Locked for 10 minutes.";
    }
  }
}

// =========================
// SHOW PANEL
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
    document.getElementById("loginError").textContent = "🔒 Locked. Try again in " + remaining + "s";
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
async function publishPost() {
  const title   = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  const msg     = document.getElementById("publishMsg");

  if (!title || !content) {
    msg.style.color = "#ff3b3b";
    msg.textContent = "⚠️ Title and content are required.";
    msg.style.display = "block";
    return;
  }

  msg.style.color = "#f5a623";
  msg.textContent = "⏳ Publishing...";
  msg.style.display = "block";

  const ok = await addBlogPost(title, content, "General");

  if (ok) {
    clearForm();
    loadAdminPosts();
    msg.style.color = "#39ff5a";
    msg.textContent = "✅ Post published successfully";
    setTimeout(function() { msg.style.display = "none"; }, 3000);
  } else {
    msg.style.color = "#ff3b3b";
    msg.textContent = "❌ Failed to publish. Check your Supabase connection.";
  }
}

// =========================
// CLEAR FORM
// =========================
function clearForm() {
  document.getElementById("title").value   = "";
  document.getElementById("content").value = "";
}

// =========================
// LOAD ADMIN POSTS
// =========================
async function loadAdminPosts() {
  const container = document.getElementById("adminPosts");
  if (!container) return;

  container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;'>Loading...</p>";

  const posts = await getAllPosts();

  if (!posts || posts.length === 0) {
    container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;'>No posts yet.</p>";
    return;
  }

  container.innerHTML = "";

  posts.forEach(function(post) {
    const wrap = document.createElement("div");
    wrap.className = "admin-post";

    const h3 = document.createElement("h3");
    h3.textContent = post.title;

    const meta = document.createElement("small");
    meta.textContent = post.category + " | " + post.date;

    const excerpt = document.createElement("p");
    excerpt.textContent = (post.content || "").substring(0, 120) + "…";

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = async function() {
      if (confirm("Delete \"" + post.title + "\"?")) {
        await deletePost(post.id);
        loadAdminPosts();
      }
    };

    wrap.append(h3, meta, excerpt, del);
    container.appendChild(wrap);
  });
}

// =========================
// TERMINAL
// =========================
function runCmd(e) {
  if (e.key !== "Enter") return;
  const cmd  = e.target.value.trim();
  const term = document.getElementById("terminal");
  const line = document.createElement("p");

  if (cmd === "status") {
    line.innerHTML = "<span class='green'>System Running OK</span>";
  } else if (cmd === "logs") {
    line.innerHTML = "<span class='amber'>No logs in demo mode.</span>";
  } else if (cmd === "help") {
    line.textContent = "Commands: status, logs, help";
  } else {
    line.className = "red";
    line.textContent = "Command not found: " + cmd;
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
  item.textContent = "[PROJECT] " + p + " — updated";
  log.appendChild(item);

  document.getElementById("project").value = "";
  document.getElementById("desc").value    = "";
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", function() {
  loadAdminPosts();
});
