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

