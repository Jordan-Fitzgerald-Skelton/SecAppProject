//Signup (no input validation)
document.getElementById("insecureSignupForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("insecureSignupEmail").value;
    const password = document.getElementById("insecureSignupPassword").value;

    fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.text())
    .then(data => alert(data))
    .catch(error => console.error("Error:", error));
});

//Login (SQL injection)
document.getElementById("insecureLoginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById("insecureEmail").value;
    const password = document.getElementById("insecurePassword").value;

    fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.text())
    .then(data => alert(data))
    .catch(error => console.error("Error:", error));
});

//Profile (XSS and plain text user info)
function viewInsecureProfile() {
    const email = document.getElementById("insecureProfileName").value;
    
    fetch(`http://localhost:3000/profile?email=${email}`)
    .then(response => response.text())
    .then(data => {
        console.log("Received data:", data);
        const div = document.createElement('div');
        // Set innerHTML directly with the response data (XSS)
        div.innerHTML = data;
        const resultDiv = document.getElementById("insecureProfileResult");
        resultDiv.innerHTML = '';
        resultDiv.appendChild(div);
    })
    .catch(error => console.error("Error:", error));
}

// Logout
function logout() {
    alert("Logged out successfully");
    location.reload();
}