//Email validation
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email).toLowerCase());
}

//Password validation
function validatePassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

//Function to check if user is logged in
function checkLoginStatus() {
    const token = localStorage.getItem("token");
    const profileButton = document.getElementById("viewProfileButton");
    const profileResult = document.getElementById("secureProfileResult");
    const profileTitle = document.getElementById("viewProfileTitle");


    if (profileButton) {
        if (token) {
            profileButton.style.display = "block";
            profileResult.style.display = "block";
            profileTitle.style.display = "block"

        } else {
            profileButton.style.display = "none";
            profileResult.style.display = "none";
            profileTitle.style.display = "none";
        }
    }
}

//Signup
document.getElementById("secureSignupForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const emailInput = document.getElementById("secureSignupEmail");
    const passwordInput = document.getElementById("secureSignupPassword");

    //Emailm validation 
    if (!validateEmail(emailInput.value)) {
        alert("Invalid sign up credentials.");
        return;
    }

    //Password validation
    if (!validatePassword(passwordInput.value)) {
        alert("Password needs to be at least 8 characters, have uppercase, lowercase, numbers and special character.");
        return;
    }

    fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }),
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error("Registration failed.") });
        }
        return response.text();
    })
    .then(data => {
        alert(data);
        emailInput.value = "";
        passwordInput.value = "";
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.message);
    });
});

//Login
document.getElementById("secureLoginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const emailInput = document.getElementById("secureEmail");
    const passwordInput = document.getElementById("securePassword");

    //Email validation
    if (!validateEmail(emailInput.value)) {
        alert("Invalid login credentials.");
        return;
    }

    //Password validation
    if (!validatePassword(passwordInput.value)) {
        alert("Password needs to be at least 8 characters, have uppercase, lowercase, numbers and special character.");
        return;
    }

    fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value, password: passwordInput.value }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Invalid login credentials.");
        }
        return response.json();
    })
    .then(data => {
        if (data.token) {
            localStorage.setItem("token", data.token);
            alert("Login successful");
            emailInput.value = "";
            passwordInput.value = "";
            checkLoginStatus();
            document.getElementById("logoutButton").style.display = "block";        
        } else {
            alert("Invalid credentials.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.message);
    });
});

//Profile
function viewSecureProfile() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please log in first");
        return;
    }
    fetch("http://localhost:4000/profile", {
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("secureProfileResult").innerHTML = `
            <p><strong>ID:</strong> ${data.id}</p>
            <p><strong>Email:</strong> ${data.email}</p>
        `;
    })
    .catch(error => console.error("Error:", error));
}

//Logout
function logout() {
    localStorage.removeItem("token");
    document.getElementById("logoutButton").style.display = "none"; 
    alert("Logged out successfully");
    location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
    if (!localStorage.getItem("token")) {
        document.getElementById("secureProfileResult").innerHTML = "<p>Click to see your details.</p>";
    }
});