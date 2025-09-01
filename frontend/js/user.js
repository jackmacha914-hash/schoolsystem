document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    // Add Teacher/Admin
    document.getElementById("add-teacher-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("teacher-name").value;
        const role = document.getElementById("teacher-role").value.toLowerCase(); // 'teacher' or 'admin'
        const subject = document.getElementById("teacher-subject").value;
        const email = document.getElementById("teacher-email").value;
        const password = document.getElementById("teacher-password").value;

        try {
            const res = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, password, role, subject })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Teacher/Admin added!");
                fetchAndRenderUsers();
            } else {
                alert(data.message || "Error adding user");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    });

    // Add Student
    document.getElementById("add-student-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("student-name").value;
        const role = document.getElementById("student-role").value.toLowerCase(); // 'student'
        const studentClass = document.getElementById("student-class").value;
        const email = document.getElementById("student-email").value;
        const password = document.getElementById("student-password").value;

        try {
            const res = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, password, role, studentClass })
            });

            const data = await res.json();
            if (res.ok) {
                alert("Student added!");
                fetchAndRenderUsers();
            } else {
                alert(data.message || "Error adding student");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    });

    // Fetch & render user lists (corrected)
    async function fetchAndRenderUsers() {
        try {
            const res = await fetch("http://localhost:5000/api/users", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const users = await res.json();

            const teacherList = document.getElementById("teacher-list");
            const studentList = document.getElementById("student-list");
            teacherList.innerHTML = "";
            studentList.innerHTML = "";

            users.forEach(user => {
                const li = document.createElement("li");
                li.textContent = `${user.name} (${user.email})`;

                if (user.role === "teacher" || user.role === "admin") {
                    teacherList.appendChild(li);
                } else if (user.role === "student") {
                    studentList.appendChild(li);
                }
            });
        } catch (err) {
            console.error("Failed to load users", err);
        }
    }

    // Initial fetch
    fetchAndRenderUsers();

    // Optional: toggle section (only if you have a button with this ID)
    const userBtn = document.getElementById("user-management-btn");
    if (userBtn) {
        userBtn.addEventListener("click", () => {
            document.getElementById("user-management-section").style.display = "block";
        });
    }
});
