// =========================
// BLOG SYSTEM — Supabase
// blog.js v3
// =========================

console.log("BLOG SYSTEM CONNECTED ✅");

const SUPABASE_URL    = "https://zocllfhpzsomhxtpyrdd.supabase.co";
const SUPABASE_ANON   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvY2xsZmhwenNvbWh4dHB5cmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjQzNTAsImV4cCI6MjA5NTM0MDM1MH0.A5iI1gRoE4rL6bmkmkB9O4GT01Sn2SHixr-EQK73RqQ";

const HEADERS = {
  "Content-Type":  "application/json",
  "apikey":        SUPABASE_ANON,
  "Authorization": "Bearer " + SUPABASE_ANON
};

// =========================
// FETCH ALL POSTS
// =========================
async function getAllPosts() {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/blog_posts?order=created_at.desc",
    { headers: HEADERS }
  );
  if (!res.ok) return [];
  return await res.json();
}

// =========================
// ADD POST
// =========================
async function addBlogPost(title, content, category = "General") {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/blog_posts",
    {
      method:  "POST",
      headers: { ...HEADERS, "Prefer": "return=representation" },
      body: JSON.stringify({
        title,
        content,
        category,
        date: new Date().toDateString()
      })
    }
  );
  return res.ok;
}

// =========================
// DELETE POST
// =========================
async function deletePost(id) {
  const res = await fetch(
    SUPABASE_URL + "/rest/v1/blog_posts?id=eq." + id,
    { method: "DELETE", headers: HEADERS }
  );
  return res.ok;
}

// =========================
// RENDER POSTS
// =========================
function renderPosts(posts) {
  const container = document.getElementById("blog-container");
  if (!container) return;

  container.innerHTML = "";

  if (!posts || posts.length === 0) {
    const empty = document.createElement("p");
    empty.style.cssText = "color:var(--text-dim);font-size:13px;padding:2rem 0;";
    empty.textContent = "No posts yet.";
    container.appendChild(empty);
    return;
  }

  const from = sessionStorage.getItem("entryPoint") || "blog";

  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "card";

    const meta = document.createElement("div");
    meta.className = "meta";

    const cat = document.createElement("span");
    cat.textContent = post.category;

    const date = document.createElement("span");
    date.textContent = post.date;

    meta.append(cat, date);

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = post.title;

    const excerpt = document.createElement("div");
    excerpt.className = "excerpt";
    excerpt.textContent = (post.content || "").substring(0, 160) + "…";

    const link = document.createElement("a");
    link.className = "read";
    link.href = "blog-post.html?id=" + encodeURIComponent(post.id) + "&from=" + encodeURIComponent(from);
    link.textContent = "Read more →";

    card.append(meta, title, excerpt, link);
    container.appendChild(card);
  });
}

// =========================
// LOAD POSTS (blog.html)
// =========================
async function loadPosts() {
  const container = document.getElementById("blog-container");
  if (!container) return;

  container.innerHTML = "<p style='color:var(--text-dim);font-size:12px;padding:2rem;'>Loading posts...</p>";

  const posts = await getAllPosts();
  renderPosts(posts);
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
window.getAllPosts  = getAllPosts;
window.addBlogPost = addBlogPost;
window.deletePost  = deletePost;
window.loadPosts   = loadPosts;
