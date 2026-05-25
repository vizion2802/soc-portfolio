// =========================
// BLOG SYSTEM (FRONTEND)
// blog.js — v2
// =========================

console.log("BLOG SYSTEM CONNECTED ✅");

let blogPosts = [];

// =========================
// SANITIZE (prevent XSS)
// =========================
function sanitize(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// =========================
// ADD NEW POST
// =========================
function addBlogPost(title, content, category = "General", date = new Date()) {
  if (!title || !content) return;

  const post = {
    id: Date.now(),
    title: title.trim(),
    content: content.trim(),
    category: category.trim(),
    date: new Date(date).toDateString()
  };

  // Re-load from storage first to avoid stale state
  const stored = localStorage.getItem("blogPosts");
  blogPosts = stored ? JSON.parse(stored) : [];

  blogPosts.unshift(post);
  savePosts();
  renderPosts();
}

// =========================
// SAVE POSTS
// =========================
function savePosts() {
  localStorage.setItem("blogPosts", JSON.stringify(blogPosts));
}

// =========================
// LOAD POSTS
// =========================
function loadPosts() {
  const stored = localStorage.getItem("blogPosts");
  if (stored) {
    try {
      blogPosts = JSON.parse(stored);
    } catch {
      blogPosts = [];
    }
  } else {
    blogPosts = [
      {
        id: 1,
        title: "Welcome to My Cybersecurity Journal",
        content:
          "This blog tracks my journey in SOC analysis, threat hunting, and ML security systems. I share write-ups, tool reviews, and lessons from the lab.",
        category: "Intro",
        date: new Date().toDateString()
      }
    ];
    savePosts();
  }
  renderPosts();
}

// =========================
// RENDER POSTS (XSS-safe)
// =========================
function renderPosts() {
  const container = document.getElementById("blog-container");
  if (!container) return;

  container.innerHTML = "";

  if (blogPosts.length === 0) {
    container.innerHTML = `<p style="color:var(--text-dim);font-size:13px;padding:2rem 0;">No posts yet. Publish your first post from the admin panel.</p>`;
    return;
  }

  const from = sessionStorage.getItem("entryPoint") || "blog";

  blogPosts.forEach(post => {
    const card = document.createElement("div");
    card.className = "blog-card";

    // All values sanitized — no innerHTML with raw user data
    const cat = document.createElement("span");
    cat.className = "blog-cat";
    cat.textContent = post.category;

    const date = document.createElement("span");
    date.className = "blog-date";
    date.textContent = post.date;

    const meta = document.createElement("div");
    meta.className = "blog-meta";
    meta.append(cat, date);

    const title = document.createElement("div");
    title.className = "blog-title";
    title.textContent = post.title;

    const excerpt = document.createElement("div");
    excerpt.className = "blog-excerpt";
    excerpt.textContent = post.content.substring(0, 160) + "…";

    const link = document.createElement("a");
    link.className = "blog-read";
    link.href = `blog-post.html?id=${encodeURIComponent(post.id)}&from=${encodeURIComponent(from)}`;
    link.textContent = "Read more →";

    card.append(meta, title, excerpt, link);
    container.appendChild(card);
  });
}

// =========================
// DELETE POST
// =========================
function deletePost(id) {
  blogPosts = blogPosts.filter(post => post.id !== id);
  savePosts();
  renderPosts();
}

// =========================
// GET ALL POSTS
// =========================
function getAllPosts() {
  const stored = localStorage.getItem("blogPosts");
  try {
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});

// =========================
// GLOBAL EXPORT
// =========================
window.addBlogPost = addBlogPost;
window.deletePost  = deletePost;
window.getAllPosts  = getAllPosts;
