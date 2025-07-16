document.addEventListener("DOMContentLoaded", () => {
    // Check for the token. If not, redirect to login.
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in as admin!");
      window.location.href = "/login";
      return;
    }
    
    // Event listener for loading users via admin API endpoint
    const loadUsersBtn = document.getElementById("loadUsersBtn");
    if (loadUsersBtn) {
      loadUsersBtn.addEventListener("click", async () => {
        try {
          const response = await fetch("/admin/users", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!response.ok) {
            alert("Failed to load users. " + (await response.text()));
            return;
          }
          const data = await response.json();
          document.getElementById("usersDiv").textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          console.error("Error loading users:", error);
          alert("Error loading users");
        }
      });
    }
    
    // Additional admin functions (update role, delete user, etc.) could go here
  });
  
  

// Fetch and display users
async function fetchUsers() {
    try {
        const response = await fetch("/admin/users");
        const data = await response.json();
        const userTable = document.getElementById("userTable");

        userTable.innerHTML = data.users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="deleteUser(${user.id})" class="btn btn-danger">Delete</button>
                    <button onclick="updateRole(${user.id}, 'admin')" class="btn btn-warning">Make Admin</button>
                </td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

// Delete a user
async function deleteUser(userId) {
    try {
        const response = await fetch("/admin/delete-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        const result = await response.json();
        alert(result.message);
        fetchUsers(); // Refresh the user list
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

// Update user role
async function updateRole(userId, role) {
    try {
        const response = await fetch("/admin/update-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role }),
        });
        const result = await response.json();
        alert(result.message);
        fetchUsers(); // Refresh the user list
    } catch (error) {
        console.error("Error updating role:", error);
    }
}

// Fetch and display logs
async function fetchLogs() {
    try {
        const response = await fetch("/admin/logs");
        const data = await response.json();
        document.getElementById("logs").textContent = data.logs;
    } catch (error) {
        console.error("Error fetching logs:", error);
    }
}

// Initialize
fetchUsers();
fetchLogs();