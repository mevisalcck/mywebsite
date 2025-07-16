document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      console.log("Attempting login with:", email);
      
      try {
        // Call JWT login endpoint
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password })
        });
        const data = await response.json();
        console.log("Login response received:", data);
        
        if (data.success && data.token) {
          localStorage.setItem("token", data.token);  // Optional, since cookies are used
          console.log("Token stored, redirecting to /dashboard...");
          window.location.href = "/dashboard";
        } else {
          console.warn("Login failed, data.message:", data.message);
          alert(data.message || "Login failed");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("Error logging in. Please try again.");
      }
    });
  } else {
    console.error("Login form not found!");
  }

  // Forgot password handling remains the same...
  window.showForgotPassword = function() {
    document.getElementById("forgotPasswordForm").style.display = "block";
  };

  const sendResetBtn = document.getElementById("sendResetBtn");
  if (sendResetBtn) {
    sendResetBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgotPasswordEmail").value;
      try {
        const response = await fetch("/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const result = await response.json();
        alert(result.message);
      } catch (error) {
        console.error("Error sending reset email:", error);
        alert("Failed to send reset email.");
      }
    });
  }
});
