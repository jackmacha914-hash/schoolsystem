document.addEventListener("DOMContentLoaded", function () {
    // Login Function
    document.getElementById("login-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                alert("Login successful!");
                window.location.href = "dashboard.html"; // Redirect to Dashboard
            } else {
                document.getElementById("login-error-message").innerText = data.msg || "Login failed!";
            }
        } catch (error) {
            console.error("Login Error:", error);
            document.getElementById("login-error-message").innerText = "Something went wrong!";
        }
    });

    // Register Function
    document.getElementById("register-form").addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const name = document.getElementById("register-name").value;
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const role = document.getElementById("register-role").value;

        try {
            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Registration successful! You can now login.");
                toggleForms(); // Switch to login form
            } else {
                document.getElementById("register-error-message").innerText = data.errors ? data.errors[0].msg : "Registration failed!";
            }
        } catch (error) {
            console.error("Registration Error:", error);
            document.getElementById("register-error-message").innerText = "Something went wrong!";
        }
    });
});

// Function to switch between login and register forms
function toggleForms() {
    document.getElementById("login-container").style.display = document.getElementById("login-container").style.display === "none" ? "block" : "none";
    document.getElementById("register-container").style.display = document.getElementById("register-container").style.display === "none" ? "block" : "none";
}
