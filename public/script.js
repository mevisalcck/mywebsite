document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const result = await response.json();
                alert(result.message);

                if (response.status === 201) {
                    window.location.href = 'login.html';
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Something went wrong!");
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('http://localhost:3000', {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.href = 'http://localhost:3000';
            } catch (error) {
                console.error("Logout error:", error);
                alert("Failed to log out!");
            }
        });
    }
});

// Fetch and display user data on dashboard
async function fetchUserData() {
    try {
        const response = await fetch("/user", { credentials: "include" });
        const data = await response.json();
        console.log("User data from /user endpoint:", data);
        if (data.user) {
            document.getElementById("userName").textContent = data.user.name;
            document.getElementById("userEmail").textContent = data.user.email;
            document.getElementById("userCreated").textContent = new Date(data.user.created_at).toLocaleString();
            document.getElementById("lastLogin").textContent = new Date(data.user.last_login).toLocaleString();
            // Pre-fill update profile form\n
            document.getElementById("profileName").value = data.user.name;
            document.getElementById("profileEmail").value = data.user.email;
            // Set profile picture\n
            document.getElementById("profilePicture").src = data.user.profile_picture 
    ? `http://localhost:3000${data.user.profile_picture}` 
    : "default.png";
        } else {
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        window.location.href = "/login";
    }
}

// Update profile (name and email)
document.getElementById("profileForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("profileName").value;
    const email = document.getElementById("profileEmail").value;
    try {
        const response = await fetch("/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, email }),
        });
        const result = await response.json();
        alert(result.message);
        fetchUserData(); // Refresh displayed data
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile.");
    }
});

// File Upload for Profile Picture
document.getElementById("uploadForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("profilePicture", document.getElementById("profilePictureInput").files[0]);
    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData,
            credentials: "include"
        });
        const result = await response.json();
        alert(result.message);
        if (result.profilePicture) {
            document.getElementById("profilePicture").src = result.profilePicture;
        }
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Failed to upload profile picture.");
    }
});
async function loadUserProfile() {
    try {
        const response = await fetch("/user", { credentials: "include" });
        const user = await response.json();
        
        document.getElementById("userName").textContent = user.name;
        document.getElementById("userEmail").textContent = user.email;
        document.getElementById("userCreated").textContent = user.created_at;
        document.getElementById("lastLogin").textContent = user.last_login;
        
        // Update profile picture (check if user has one)
        if (user.profilePicture) {
            document.getElementById("profilePicture").src = user.profilePicture;
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

// Load user data on page load
document.addEventListener("DOMContentLoaded", loadUserProfile);



// Existing functions: showChangePassword, changePassword, confirmDeleteAccount, logout, toggleDarkMode
function showChangePassword() {
    document.getElementById("changePasswordForm").style.display = "block";
}

async function changePassword() {
    const newPassword = document.getElementById("newPassword").value;
    try {
        const response = await fetch("/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ newPassword }),
        });
        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error("Error changing password:", error);
        alert("Failed to change password.");
    }
}

async function confirmDeleteAccount() {
    try {
        const response = await fetch("/delete-account", { method: "POST", credentials: "include" });
        const result = await response.json();
        alert(result.message);
        window.location.href = "/login";
    } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account.");
    }
}

async function logout() {
    try {
        await fetch("/logout", { method: "POST", credentials: "include" });
        window.location.href = "/login";
    } catch (error) {
        console.error("Error logging out:", error);
        alert("Failed to logout.");
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {    
    fetchUserData();});
