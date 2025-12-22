const form = document.getElementById('loginForm');

form.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Load users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // Validate credentials
    const user = users.find(
        u => u.username === username && u.password === password
    );

    if (!user) {
        alert('Invalid username or password');
        return;
    }

    // Save current user in SESSION storage
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    // localStorage.setItem('currentUser', JSON.stringify(user)); //For tests: after - remove this and un-note line above



    // Redirect to search page
    window.location.href = "search.html";
});
