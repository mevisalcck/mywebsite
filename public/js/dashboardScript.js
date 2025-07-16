document.addEventListener("DOMContentLoaded", () => {
  // Instead of checking localStorage, we rely on cookies (set via the login endpoint)
  console.log("Dashboard script running. Cookies: ", document.cookie);

  // Fetch user data from /user; the server will use the cookie-based JWT.
  async function fetchUserData() {
    try {
      const response = await fetch("/user");
      const data = await response.json();
      if (data.user) {
        document.getElementById("userName").textContent = data.user.name;
        document.getElementById("userEmail").textContent = data.user.email;
        document.getElementById("userCreated").textContent = new Date(data.user.created_at).toLocaleString();
        document.getElementById("lastLogin").textContent = new Date(data.user.last_login).toLocaleString();
        // Set profile picture; adjust the URL as needed.
        document.getElementById("profilePicture").src = data.user.profile_picture
          ? `https://itsme.cck.com:3000${data.user.profile_picture}`
          : "default.png";
      } else {
        // If no user data is returned, redirect to login.
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      window.location.href = "/login";
    }
  }
  
  fetchUserData();
  
  // Logout functionality
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/logout", { method: "POST" });
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
        alert("Failed to logout.");
      }
    });
  }
  
  // Secure Data Example
  const loadSecureDataBtn = document.getElementById("loadSecureDataBtn");
  if (loadSecureDataBtn) {
    loadSecureDataBtn.addEventListener("click", async () => {
      try {
        // Make a secure API call; the cookie with the accessToken is automatically sent.
        const response = await fetch("/api/secure-data");
        if (!response.ok) {
          alert("Failed to load secure data. Token might be invalid or expired.");
          return;
        }
        const data = await response.json();
        document.getElementById("secureDataDiv").textContent = JSON.stringify(data);
      } catch (err) {
        console.error("Error loading secure data:", err);
        alert("Error loading secure data");
      }
    });
  }
});
