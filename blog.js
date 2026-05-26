// =========================
// BLOG SYSTEM — blog.js v4
// Supabase powered
// =========================

console.log("BLOG SYSTEM CONNECTED ✅");

var SUPABASE_URL  = "https://zocllfhpzsomhxtpyrdd.supabase.co";
var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvY2xsZmhwenNvbWh4dHB5cmRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjQzNTAsImV4cCI6MjA5NTM0MDM1MH0.A5iI1gRoE4rL6bmkmkB9O4GT01Sn2SHixr-EQK73RqQ";

// =========================
// GET ALL POSTS
// =========================
async function getAllPosts() {
  try {
    var res = await fetch(
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
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    return [];
  }
}

// =========================
// RENDER POSTS
// =========================
function renderPosts(posts) {
  var container = document.getElementById("blog-container");
  if (!container) return;

  container.innerHTML = "";

  if (!posts || posts.length === 0) {
    var empty = document.createElement("p");
    empty.style.cssText = "color:var(--dim);font-size:13px;padding:2rem 0;grid-column:1/-1;";
    empty.textContent = "No posts yet.";
    container.appendChild(empty);
    return;
  }

  var from = sessionStorage.getItem("entryPoint") || "blog";

  posts.forEach(function(post) {
    var card = document.createElement("div");
    card.className = "card";

    var meta = document.createElement("div");
    meta.className = "meta";

    var cat = document.createElement("span");
    cat.textContent = post.category;

    var date = document.createElement("span");
    date.textContent = post.date;

    meta.append(cat, date);

    var title = document.createElement("div");
    title.className = "title";
    title.textContent = post.title;

    var excerpt = document.createElement("div");
    excerpt.className = "excerpt";
    excerpt.textContent = (post.content || "").substring(0, 160) + "…";

    var link = document.createElement("a");
    link.className = "read";
    link.href = "blog-post.html?id=" + encodeURIComponent(post.id) + "&from=" + encodeURIComponent(from);
    link.textContent = "Read more →";

    card.append(meta, title, excerpt, link);
    container.appendChild(card);
  });
}

// =========================
// LOAD POSTS
// =========================
async function loadPosts() {
  var container = document.getElementById("blog-container");
  if (!container) return;

  container.innerHTML = "<p style='color:var(--dim);font-size:12px;padding:2rem;'>Loading posts...</p>";

  var posts = await getAllPosts();
  renderPosts(posts);
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", function() {
  loadPosts();
});

// =========================
// GLOBAL EXPORT
// =========================
window.getAllPosts = getAllPosts;
window.loadPosts  = loadPosts;
window.addBlogPost = function() { console.warn("Use admin panel to add posts."); };
window.deletePost  = function() { console.warn("Use admin panel to delete posts."); };
