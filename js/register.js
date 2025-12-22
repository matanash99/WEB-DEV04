const form = document.getElementById('registerForm');

form.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const firstName = document.getElementById('firstName').value.trim();
    const imageURL = document.getElementById('imageURL').value.trim();

    // Password validation: min 6 chars, 1 letter, 1 number, 1 special
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password)) {
        alert("Password must contain at least 1 letter, 1 number, 1 special character, and minimum 6 characters.");
        return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Use namespaced key for registration users
    const storageKey = 'users';
    let users = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Check if username exists
    if (users.some(u => u.username === username)) {
        alert("Username already exists.");
        return;
    }

    // Add new user
    const newUser = { username, password, firstName, imageURL };
    users.push(newUser);
    localStorage.setItem(storageKey, JSON.stringify(users));

    alert("Registration successful! Redirecting to login page.");
    window.location.href = "login.html";
});

function loadCurrentUser() {
    const user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) return;

    const userInfo = document.getElementById('userInfo');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userImage = document.getElementById('userImage');

    if (userInfo && usernameDisplay && userImage) {
        usernameDisplay.textContent = user.username;
        userImage.src = user.imageURL;
        userInfo.classList.remove('d-none');
    }
}

document.addEventListener('DOMContentLoaded', loadCurrentUser);
