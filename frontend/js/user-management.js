// ==========================
// User Management JS
// ==========================
const API_BASE_URL = "http://localhost:5000/api"; // backend API
const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

// Redirect to login if not logged in
if (!token) {
    alert("You are not logged in. Redirecting to login page.");
    window.location.href = "login.html";
}

// ==========================
// Password Validation
// ==========================
function validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+]/.test(password);

    if (password.length < minLength) return "Password must be at least 8 characters long.";
    if (!hasUpper) return "Password must contain at least one uppercase letter.";
    if (!hasLower) return "Password must contain at least one lowercase letter.";
    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasSpecial) return "Password must contain at least one special character.";

    return "valid";
}

// ==========================
// DOM Content Loaded
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const addUserForm = document.getElementById("addUserForm");
    const userTableBody = document.getElementById("userTableBody");

    // Load Users
    loadUsers();

    // Handle Add User
    addUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const userData = {
            username: document.getElementById("username").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("password").value,
            firstName: document.getElementById("firstName") ? document.getElementById("firstName").value.trim() : "First",
            lastName: document.getElementById("lastName") ? document.getElementById("lastName").value.trim() : "Last",
            role: document.getElementById("role").value,
        };

        // Validate password
        const passwordValidationMessage = validatePassword(userData.password);
        if (passwordValidationMessage !== "valid") {
            alert("❌ Invalid password:\n" + passwordValidationMessage);
            return; // Stop submission
        }

        try {
            const res = await fetch(`${API_BASE_URL}/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ User added successfully!");
                addUserForm.reset();
                loadUsers();
            } else {
                alert(data.message || "❌ Error adding user!");
            }
        } catch (err) {
            console.error("Server error:", err);
            alert("❌ Server error! Make sure backend is running.");
        }
    });

    // ==========================
    // Load all users
    // ==========================
    async function loadUsers() {
        userTableBody.innerHTML = "";
        try {
            const res = await fetch(`${API_BASE_URL}/`, {
                headers: { "Authorization": `Bearer ${token}` },
            });

            const data = await res.json();
            const users = data.users || [];

            // Get current logged-in user
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

            // Filter out the logged-in admin
            const usersToDisplay = users.filter(user => user.email !== currentUser.email);

            if (usersToDisplay.length === 0) {
                userTableBody.innerHTML = `<tr>
          <td colspan="4" style="text-align:center; color: gray;">No users found</td>
        </tr>`;
                return;
            }
            usersToDisplay.forEach((user) => {
                const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim(); // Combine first and last name
                const row = document.createElement("tr");
                row.innerHTML = `
                <td>${user.username}</td>
                <td>${fullName}</td>  <!-- Full name column -->
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                  <button onclick="deleteUser('${user._id}')">Delete</button>
               </td>
               `;
                userTableBody.appendChild(row);
            });


        } catch (err) {
            console.error("Error fetching users:", err);
            alert("❌ Failed to load users.");
        }
    }
});

// ==========================
// Delete User
// ==========================
async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

    try {
        const res = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok) {
            alert("✅ User deleted successfully!");
            // Reload user table
            document.dispatchEvent(new Event("DOMContentLoaded"));
        } else {
            alert(data.message || "❌ Error deleting user!");
        }
    } catch (err) {
        console.error("Server error:", err);
        alert("❌ Server error!");
    }
}
