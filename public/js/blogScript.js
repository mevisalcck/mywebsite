// In public/js/blogScript.js
document.addEventListener("DOMContentLoaded", () => {
  
    // New Post Submission
    const postForm = document.getElementById("postForm");
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("postTitle").value;
      const content = document.getElementById("postContent").value;
      try {
        const response = await fetch("/blog/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content })
        });
        const result = await response.json();
        alert(result.message);
        loadPosts();
      } catch (err) {
        console.error("Error creating post:", err);
        alert("Failed to create post.");
      }
    });
    
    // Load Posts with their Comments
    async function loadPosts() {
      try {
        const response = await fetch("/blog/posts");
        const posts = await response.json();
        const postsDiv = document.getElementById("posts");
        if (posts.length === 0) {
          postsDiv.innerHTML = "<p>No posts found.</p>";
          return;
        }
        postsDiv.innerHTML = posts.map(post => {
            let commentHtml = "";
            if (post.comments && post.comments.length) {
              commentHtml = post.comments.map(comment => `
                <div class="mb-2">
                  <strong>${comment.commenter}:</strong> ${comment.comment} 
                  <small class="text-muted">(${new Date(comment.created_at).toLocaleString()})</small>
                </div>
              `).join("");
            }
            return `
              <div class="col-md-6">
                <div class="card mb-4 shadow-sm">
                  <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <p class="card-text">${post.content}</p>
                    <p class="card-text"><small class="text-muted">By ${post.author} on ${new Date(post.created_at).toLocaleString()}</small></p>
                    <hr>
                    <div>
                      <button class="btn btn-danger btn-sm" onclick="deletePost(${post.id})">Delete Post</button>
                    </div>
                    <h6 class="mt-3">Comments:</h6>
                    <div>${commentHtml}</div>
                    <form class="mt-2" onsubmit="return addComment(event, ${post.id})">
                      <div class="input-group input-group-sm">
                        <input type="text" class="form-control" placeholder="Your comment" required>
                        <button class="btn btn-outline-secondary" type="submit">Add</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            `;
          }).join("");          
      } catch (err) {
        console.error("Error loading posts:", err);
      }
    }
    
    window.addComment = async function(e, postId) {
      e.preventDefault();
      const form = e.target;
      const commentInput = form.querySelector("input");
      const comment = commentInput.value;
      try {
        const response = await fetch(`/blog/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment })
        });
        const result = await response.json();
        alert(result.message);
        loadPosts();
        form.reset();
      } catch (err) {
        console.error("Error posting comment:", err);
        alert("Failed to post comment.");
      }
    };
    window.deletePost = async function(postId) {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
          const response = await fetch(`/blog/post/${postId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
          });
          const result = await response.json();
          alert(result.message);
          loadPosts(); // Refresh posts after deletion
        } catch (err) {
          console.error("Error deleting post:", err);
          alert("Failed to delete post.");
        }
      };      
  
    // Search posts functionality remains the same...
    const searchForm = document.getElementById("searchForm");
    searchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const query = document.querySelector('input[name="query"]').value;
      try {
        const response = await fetch("/blog/search?query=" + encodeURIComponent(query));
        const results = await response.json();
        const postsDiv = document.getElementById("posts");
        if (results.length === 0) {
          postsDiv.innerHTML = "<p>No matching posts found.</p>";
          return;
        }
        postsDiv.innerHTML = results.map(post => `
            <div class="card mb-3">
              <div class="card-body">
                <h5>${post.title}</h5>
                <p>${post.content}</p>
              </div>
            </div>
          `).join("");
      } catch (err) {
        console.error("Error searching posts:", err);
      }
    });
    
    loadPosts();
  });
  