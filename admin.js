// =========================
// ADMIN PANEL — admin.js v9
// Password + OTP 2FA
// =========================

console.log("ADMIN PANEL CONNECTED ✅");

var ADMIN_HASH   = "d329574f747890c4b6d489aa1a32669bb10ba4ba54190919daaafe2a79bfb3e3";
var EDGE_URL     = "https://zocllfhpzsomhxtpyrdd.supabase.co/functions/v1/manage-posts";
var ADMIN_SECRET = "d329574f747890c4b6d489aa1a32669bb10ba4ba54190919daaafe2a79bfb3e3";
var SUPA_URL     = "https://zocllfhpzsomhxtpyrdd.supabase.co";
var SUPA_ANON    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvY2xsZmhwenNvbWh4dHB5cmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjQzNTAsImV4cCI6MjA5NTM0MDM1MH0.A5iI1gRoE4rL6bmkmkB9O4GT01Sn2SHixr-EQK73RqQ";

var attempts     = 0;
var MAX_ATTEMPTS = 3;
var LOCK_MS      = 10 * 60 * 1000;

// =========================
// HASH HELPER
// =========================
async function sha256(str) {
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
}

// =========================
// STEP 1 — PASSWORD CHECK
// =========================
async function checkPassword() {
  var input = document.getElementById("password").value;
  var error = document.getElementById("loginError");
  var btn   = document.getElementById("loginBtn");

  // Lock check
  var lockUntil = localStorage.getItem("adminLockUntil");
  if (lockUntil && Date.now() < Number(lockUntil)) {
    error.textContent = "🔒 Locked. Try again in " + Math.ceil((Number(lockUntil) - Date.now()) / 1000) + "s";
    return;
  }

  btn.disabled = true;
  btn.textContent = "Checking…";

  var hash = await sha256(input);

  btn.disabled = false;
  btn.textContent = "Login";

  if (hash === ADMIN_HASH) {
    attempts = 0;
    localStorage.removeItem("adminLockUntil");

    // Password correct — send OTP
    error.style.color = "#f5a623";
    error.textContent = "⏳ Sending OTP to your email...";

    try {
      var res = await fetch(EDGE_URL + "?action=send-otp", {
        method: "POST",
        headers: {
          "Content-Type":   "application/json",
          "x-admin-secret": ADMIN_SECRET,
          "Authorization":  "Bearer " + SUPA_ANON
        },
        body: JSON.stringify({})
      });

      var data = await res.json();

      if (data.success) {
        // Show OTP step
        document.getElementById("passwordStep").style.display = "none";
        document.getElementById("otpStep").style.display      = "flex";
        error.textContent = "";
        document.getElementById("otpInfo").textContent = "✅ OTP sent to your email. Enter it below.";
        // Start countdown
        startOTPCountdown();
      } else {
        error.style.color = "#ff3b3b";
        error.textContent = "❌ Failed to send OTP: " + (data.error || "Unknown error");
      }
    } catch(e) {
      error.style.color = "#ff3b3b";
      error.textContent = "❌ Network error sending OTP.";
    }

  } else {
    attempts++;
    error.style.color = "#ff3b3b";
    error.textContent = "❌ Wrong password (" + attempts + "/" + MAX_ATTEMPTS + ")";
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem("adminLockUntil", String(Date.now() + LOCK_MS));
      error.textContent = "🚨 Too many attempts. Locked for 10 minutes.";
    }
  }
}

// =========================
// STEP 2 — OTP VERIFY
// =========================
async function verifyOTP() {
  var otp     = document.getElementById("otpInput").value.trim();
  var msg     = document.getElementById("otpError");
  var btn     = document.getElementById("otpBtn");

  if (!otp || otp.length !== 6) {
    msg.textContent = "⚠️ Enter the 6-digit OTP.";
    return;
  }

  btn.disabled    = true;
  btn.textContent = "Verifying…";

  try {
    var res = await fetch(EDGE_URL + "?action=verify-otp", {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "x-admin-secret": ADMIN_SECRET,
        "Authorization":  "Bearer " + SUPA_ANON
      },
      body: JSON.stringify({ otp: otp })
    });

    var data = await res.json();

    btn.disabled    = false;
    btn.textContent = "Verify OTP";

    if (data.success) {
      sessionStorage.setItem("adminAuth", "true");
      showPanel();
    } else {
      msg.textContent = "❌ " + (data.error || "Invalid OTP");
    }
  } catch(e) {
    btn.disabled    = false;
    btn.textContent = "Verify OTP";
    msg.textContent = "❌ Network error. Try again.";
  }
}

// =========================
// OTP COUNTDOWN (5 min)
// =========================
var countdownInterval = null;

function startOTPCountdown() {
  var seconds  = 5 * 60;
  var el       = document.getElementById("otpCountdown");
  clearInterval(countdownInterval);

  countdownInterval = setInterval(function() {
    seconds--;
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    el.textContent = "OTP expires in " + m + ":" + (s < 10 ? "0" : "") + s;

    if (seconds <= 0) {
      clearInterval(countdownInterval);
      el.textContent = "OTP expired. Please login again.";
      el.style.color = "#ff3b3b";
      setTimeout(function() {
        document.getElementById("otpStep").style.display      = "none";
        document.getElementById("passwordStep").style.display = "flex";
        document.getElementById("otpInput").value             = "";
      }, 2000);
    }
  }, 1000);
}

// =========================
// RESEND OTP
// =========================
async function resendOTP() {
  var info = document.getElementById("otpInfo");
  info.style.color = "#f5a623";
  info.textContent = "⏳ Resending OTP...";

  try {
    var res = await fetch(EDGE_URL + "?action=send-otp", {
      method: "POST",
      headers: {
        "Content-Type":   "application/json",
        "x-admin-secret": ADMIN_SECRET,
        "Authorization":  "Bearer " + SUPA_ANON
      },
      body: JSON.stringify({})
    });

    var data = await res.json();

    if (data.success) {
      info.style.color = "#39ff5a";
      info.textContent = "✅ OTP resent to your email.";
      startOTPCountdown();
    } else {
      info.style.color = "#ff3b3b";
      info.textContent = "❌ Failed to resend OTP.";
    }
  } catch(e) {
    info.style.color = "#ff3b3b";
    info.textContent = "❌ Network error.";
  }
}

// =========================
// SHOW PANEL
// =========================
function showPanel() {
  document.getElementById("loginBox").style.display   = "none";
  document.getElementById("adminPanel").style.display = "block";
  clearInterval(countdownInterval);
  loadAdminPosts();
  loadAdminProjects();
}

// =========================
// AUTO LOGIN CHECK
// =========================
window.onload = function () {
  var lockUntil = localStorage.getItem("adminLockUntil");
  if (lockUntil && Date.now() < Number(lockUntil)) {
    document.getElementById("loginError").textContent = "🔒 Locked. Try again in " + Math.ceil((Number(lockUntil) - Date.now()) / 1000) + "s";
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
// EDGE FUNCTION CALL
// =========================
async function edgeCall(method, body, table) {
  table = table || "blog_posts";
  try {
    var res = await fetch(EDGE_URL + "?table=" + table, {
      method: method,
      headers: {
        "Content-Type":   "application/json",
        "x-admin-secret": ADMIN_SECRET,
        "Authorization":  "Bearer " + SUPA_ANON
      },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch(e) {
    console.error("Edge call failed:", e);
    return { error: "Network error" };
  }
}

// =========================
// READ FROM SUPABASE
// =========================
async function supaRead(table) {
  try {
    var res = await fetch(SUPA_URL + "/rest/v1/" + table + "?order=created_at.desc", {
      headers: { "apikey": SUPA_ANON, "Authorization": "Bearer " + SUPA_ANON }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch(e) { return []; }
}

// =========================
// PUBLISH BLOG POST
// =========================
async function publishPost() {
  var title   = document.getElementById("title").value.trim();
  var content = document.getElementById("content").value.trim();
  var msg     = document.getElementById("publishMsg");

  if (!title || !content) { showMsg(msg, "⚠️ Title and content are required.", "#ff3b3b"); return; }

  showMsg(msg, "⏳ Publishing...", "#f5a623");

  var data = await edgeCall("POST", { title: title, content: content, category: "General", date: new Date().toDateString() }, "blog_posts");

  if (data.success) {
    document.getElementById("title").value   = "";
    document.getElementById("content").value = "";
    loadAdminPosts();
    showMsg(msg, "✅ Post published successfully", "#39ff5a");
    setTimeout(function(){ msg.style.display = "none"; }, 3000);
  } else {
    showMsg(msg, "❌ Failed: " + (data.error || "Unknown error"), "#ff3b3b");
  }
}

// =========================
// ADD PROJECT
// =========================
async function publishProject() {
  var ptitle  = document.getElementById("p-title").value.trim();
  var pdesc   = document.getElementById("p-desc").value.trim();
  var pcat    = document.getElementById("p-cat").value.trim();
  var pstack  = document.getElementById("p-stack").value.trim();
  var preport = document.getElementById("p-report").value.trim();
  var pshot   = document.getElementById("p-screenshot").value.trim();
  var msg     = document.getElementById("projectMsg");

  if (!ptitle || !pdesc || !pstack) { showMsg(msg, "⚠️ Title, description and stack are required.", "#ff3b3b"); return; }

  showMsg(msg, "⏳ Saving project...", "#f5a623");

  var data = await edgeCall("POST", {
    title: ptitle, description: pdesc, category: pcat || "soc",
    stack: pstack, report_url: preport, screenshot_url: pshot
  }, "projects");

  if (data.success) {
    document.getElementById("p-title").value      = "";
    document.getElementById("p-desc").value       = "";
    document.getElementById("p-stack").value      = "";
    document.getElementById("p-report").value     = "";
    document.getElementById("p-screenshot").value = "";
    loadAdminProjects();
    showMsg(msg, "✅ Project saved successfully", "#39ff5a");
    setTimeout(function(){ msg.style.display = "none"; }, 3000);
  } else {
    showMsg(msg, "❌ Failed: " + (data.error || "Unknown error"), "#ff3b3b");
  }
}

// =========================
// SHOW MSG HELPER
// =========================
function showMsg(el, text, color) {
  el.style.color   = color;
  el.textContent   = text;
  el.style.display = "block";
}

// =========================
// LOAD ADMIN POSTS
// =========================
async function loadAdminPosts() {
  var container = document.getElementById("adminPosts");
  if (!container) return;
  container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;'>Loading...</p>";

  var posts = await supaRead("blog_posts");
  if (!posts || posts.length === 0) {
    container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;'>No posts yet.</p>";
    return;
  }

  container.innerHTML = "";
  posts.forEach(function(post) {
    var wrap = document.createElement("div"); wrap.className = "admin-post";
    var h3   = document.createElement("h3");  h3.textContent = post.title;
    var meta = document.createElement("small"); meta.textContent = post.category + " | " + post.date;
    var exc  = document.createElement("p");   exc.textContent = (post.content||"").substring(0,120)+"…";
    var del  = document.createElement("button"); del.textContent = "Delete";
    del.onclick = async function() {
      if (!confirm("Delete \"" + post.title + "\"?")) return;
      var d = await edgeCall("DELETE", { id: post.id }, "blog_posts");
      if (d.success) loadAdminPosts(); else alert("Failed to delete.");
    };
    wrap.append(h3, meta, exc, del);
    container.appendChild(wrap);
  });
}

// =========================
// LOAD ADMIN PROJECTS
// =========================
async function loadAdminProjects() {
  var container = document.getElementById("adminProjectsList");
  if (!container) return;
  container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;'>Loading...</p>";

  var projects = await supaRead("projects");
  if (!projects || projects.length === 0) {
    container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;'>No projects yet.</p>";
    return;
  }

  container.innerHTML = "";
  projects.forEach(function(proj) {
    var wrap = document.createElement("div"); wrap.className = "admin-post";
    var h3   = document.createElement("h3");  h3.textContent = proj.title;
    var meta = document.createElement("small"); meta.textContent = proj.category + " | " + proj.stack;
    var exc  = document.createElement("p");   exc.textContent = (proj.description||"").substring(0,120)+"…";

    var links = document.createElement("div");
    links.style.cssText = "display:flex;gap:0.5rem;margin-bottom:0.5rem;flex-wrap:wrap;";

    if (proj.report_url) {
      var rLink = document.createElement("a");
      rLink.href = proj.report_url; rLink.target = "_blank";
      rLink.textContent = "📄 Report";
      rLink.style.cssText = "font-size:11px;color:var(--green);text-decoration:none;border:1px solid var(--green);padding:2px 8px;";
      links.appendChild(rLink);
    }
    if (proj.screenshot_url) {
      var sLink = document.createElement("a");
      sLink.href = proj.screenshot_url; sLink.target = "_blank";
      sLink.textContent = "🖼 Screenshot";
      sLink.style.cssText = "font-size:11px;color:var(--amber);text-decoration:none;border:1px solid var(--amber);padding:2px 8px;";
      links.appendChild(sLink);
    }

    var del = document.createElement("button"); del.textContent = "Delete";
    del.onclick = async function() {
      if (!confirm("Delete \"" + proj.title + "\"?")) return;
      var d = await edgeCall("DELETE", { id: proj.id }, "projects");
      if (d.success) loadAdminProjects(); else alert("Failed to delete.");
    };

    wrap.append(h3, meta, exc, links, del);
    container.appendChild(wrap);
  });
}

// =========================
// TERMINAL
// =========================
function runCmd(e) {
  if (e.key !== "Enter") return;
  var cmd  = e.target.value.trim();
  var term = document.getElementById("terminal");
  var line = document.createElement("p");
  if      (cmd === "status") line.innerHTML  = "<span class='green'>System Running OK</span>";
  else if (cmd === "logs")   line.innerHTML  = "<span class='amber'>No logs in demo mode.</span>";
  else if (cmd === "help")   line.textContent = "Commands: status, logs, help";
  else { line.className = "red"; line.textContent = "Command not found: " + cmd; }
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
  e.target.value = "";
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", function() {
  loadAdminPosts();
  loadAdminProjects();
});
