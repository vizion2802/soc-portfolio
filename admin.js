// =========================
// ADMIN PANEL — admin.js v5
// Supabase Edge Function
// =========================

console.log("ADMIN PANEL CONNECTED ✅");

const ADMIN_HASH   = "d329574f747890c4b6d489aa1a32669bb10ba4ba54190919daaafe2a79bfb3e3";
const EDGE_URL     = "https://zocllfhpzsomhxtpyrdd.supabase.co/functions/v1/manage-posts";
const ADMIN_SECRET = "SOC@dmin$ecret2026!";

const SUPABASE_URL  = "https://zocllfhpzsomhxtpyrdd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvY2xsZmhwenNvbWh4dHB5cmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjQzNTAsImV4cCI6MjA5NTM0MDM1MH0.A5iI1gRoE4rL6bmkmkB9O4GT01Sn2SHixr-EQK73RqQ";

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
// PUBLISH POST — via Edge Function
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

  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type":    "application/json",
        "x-admin-secret":  ADMIN_SECRET
      },
      body: JSON.stringify({ title, content, category: "General" })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      clearForm();
      loadAdminPosts();
      msg.style.color = "#39ff5a";
      msg.textContent = "✅ Post published successfully";
      setTimeout(function() { msg.style.display = "none"; }, 3000);
    } else {
      msg.style.color = "#ff3b3b";
      msg.textContent = "❌ Failed: " + (data.error || "Unknown error");
    }
  } catch (err) {
    msg.style.color = "#ff3b3b";
    msg.textContent = "❌ Network error. Check your connection.";
  }
}

// =========================
// DELETE POST — via Edge Function
// =========================
async function deletePost(id) {
  try {
    const res = await fetch(EDGE_URL, {
      method: "DELETE",
      headers: {
        "Content-Type":   "application/json",
        "x-admin-secret": ADMIN_SECRET
      },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    return res.ok && data.success;
  } catch (err) {
    console.error("Delete failed:", err);
    return false;
  }
}

// =========================
// GET ALL POSTS — public read
// =========================
async function getAllPosts() {
  try {
    const res = await fetch(
      SUPABASE_URL + "/rest/v1/blog_posts?order=created_at.desc",
      {
        headers: {
          "apikey":        SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON
        }
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
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
        const ok = await deletePost(post.id);
        if (ok) {
          loadAdminPosts();
        } else {
          alert("Failed to delete post.");
        }
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
