// ---------- AUTH CHECK ----------
const currentUser = JSON.parse(sessionStorage.getItem('currentUser')); 
// const currentUser = JSON.parse(localStorage.getItem('currentUser')); 
if (!currentUser) {
    window.location.href = "login.html";
}

// ---------- PLAYER STATE ----------
let player;
let currentVideoIndex = 0;
let currentVideosQueue = [];

// ---------- SHOW USER INFO ----------
document.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('userInfo');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userImage = document.getElementById('userImage');

    usernameDisplay.textContent = currentUser.username;
    userImage.src = currentUser.imageURL;
    userInfo.classList.remove('d-none');

    loadPlaylists();
});

// ---------- ELEMENTS ----------
const playlistList = document.getElementById('playlistList');
const playlistVideosContainer = document.getElementById('playlistVideosContainer');
const playlistSearchInput = document.getElementById('playlistSearchInput');
const sortAlphaBtn = document.getElementById('sortAlphaBtn');
const sortRatingBtn = document.getElementById('sortRatingBtn');
const newPlaylistBtn = document.getElementById('newPlaylistBtn');
const newPlaylistModal = new bootstrap.Modal(document.getElementById('newPlaylistModal'));
const createPlaylistBtn = document.getElementById('createPlaylistBtn');
const newPlaylistNameInput = document.getElementById('newPlaylistName');
const playPlaylistBtn = document.getElementById('playPlaylistBtn');

let currentPlaylistName = null;

// ---------- LOAD PLAYLISTS ----------
function loadPlaylists() {
    const playlistsKey = `playlists_${currentUser.username}`;
    const playlists = JSON.parse(localStorage.getItem(playlistsKey)) || [];

    playlistList.innerHTML = '';
    playlists.forEach(plName => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = plName;
        li.addEventListener('click', () => selectPlaylist(plName));
        playlistList.appendChild(li);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const selectedName = urlParams.get('name') || playlists[0];
    if (selectedName) selectPlaylist(selectedName);
}

// ---------- SELECT PLAYLIST ----------
function selectPlaylist(name) {
    currentPlaylistName = name;
    [...playlistList.children].forEach(li =>
        li.classList.toggle('active', li.textContent === name)
    );
    loadPlaylistVideos(name);
}

// ---------- LOAD VIDEOS ----------
function loadPlaylistVideos(name) {
    const key = `playlist_${currentUser.username}_${name}`;
    const videos = JSON.parse(localStorage.getItem(key)) || [];
    renderVideoCards(videos);
}

// ---------- RENDER VIDEO CARDS ----------
function renderVideoCards(videos) {
    playlistVideosContainer.innerHTML = '';

    if (videos.length === 0) {
        playlistVideosContainer.innerHTML = '<p>This playlist is empty.</p>';
        return;
    }

    videos.forEach((video, index) => {   // ✅ index added
        const card = document.createElement('div');
        card.className = 'col-md-4';

        const ratingKey = `rating_${currentUser.username}_${currentPlaylistName}_${video.id.videoId}`;
        const savedRating = parseInt(localStorage.getItem(ratingKey)) || 0;

        card.innerHTML = `
            <div class="card h-100">
                <img src="${video.snippet.thumbnails.medium.url}" class="card-img-top">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title">${video.snippet.title}</h5>
                        <div class="star-rating" data-video-id="${video.id.videoId}">
                            ${[...Array(10)].map((_, i) =>
                                `<i class="bi bi-star-fill star ${i < savedRating ? 'text-warning' : ''}" data-value="${i+1}"></i>`
                            ).join('')}
                        </div>
                    </div>
                    <button class="btn btn-sm btn-danger delete-video-btn mt-2">Delete</button>
                </div>
            </div>
        `;

        playlistVideosContainer.appendChild(card);

        // ✅ CLICK CARD → PLAY FROM THIS VIDEO
        card.addEventListener('click', () => {
            playFromIndex(videos, index);
        });

        // ✅ DELETE (stop propagation)
        card.querySelector('.delete-video-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteVideoFromPlaylist(video, currentPlaylistName);
        });
    });

    attachStarRatings();
}

// ---------- STAR RATINGS ----------
function attachStarRatings() {
    document.querySelectorAll('.star-rating').forEach(container => {
        const videoId = container.dataset.videoId;
        const stars = container.querySelectorAll('.star');

        stars.forEach((star, index) => {
            star.addEventListener('mouseover', () => {
                stars.forEach((s, i) => s.classList.toggle('text-warning', i <= index));
            });

            star.addEventListener('mouseout', () => {
                const saved = parseInt(localStorage.getItem(
                    `rating_${currentUser.username}_${currentPlaylistName}_${videoId}`
                )) || 0;
                stars.forEach((s, i) => s.classList.toggle('text-warning', i < saved));
            });

            star.addEventListener('click', () => {
                const rating = index + 1;
                localStorage.setItem(
                    `rating_${currentUser.username}_${currentPlaylistName}_${videoId}`,
                    rating
                );
                stars.forEach((s, i) => s.classList.toggle('text-warning', i < rating));
            });
        });
    });
}

// ---------- DELETE VIDEO ----------
function deleteVideoFromPlaylist(video, playlistName) {
    const key = `playlist_${currentUser.username}_${playlistName}`;
    let videos = JSON.parse(localStorage.getItem(key)) || [];
    videos = videos.filter(v => v.id.videoId !== video.id.videoId);
    localStorage.setItem(key, JSON.stringify(videos));
    loadPlaylistVideos(playlistName);
}

// ---------- SORTING ----------
sortAlphaBtn.addEventListener('click', () => {
    if (!currentPlaylistName) return;
    const key = `playlist_${currentUser.username}_${currentPlaylistName}`;
    const videos = JSON.parse(localStorage.getItem(key)) || [];
    videos.sort((a, b) => a.snippet.title.localeCompare(b.snippet.title));
    renderVideoCards(videos);
});

sortRatingBtn.addEventListener('click', () => {
    if (!currentPlaylistName) return;
    const key = `playlist_${currentUser.username}_${currentPlaylistName}`;
    const videos = JSON.parse(localStorage.getItem(key)) || [];
    videos.sort((a, b) => {
        const rA = parseInt(localStorage.getItem(
            `rating_${currentUser.username}_${currentPlaylistName}_${a.id.videoId}`
        )) || 0;
        const rB = parseInt(localStorage.getItem(
            `rating_${currentUser.username}_${currentPlaylistName}_${b.id.videoId}`
        )) || 0;
        return rB - rA;
    });
    renderVideoCards(videos);
});

// ---------- SEARCH ----------
playlistSearchInput.addEventListener('input', () => {
    if (!currentPlaylistName) return;
    const key = `playlist_${currentUser.username}_${currentPlaylistName}`;
    const videos = JSON.parse(localStorage.getItem(key)) || [];
    const q = playlistSearchInput.value.toLowerCase();
    renderVideoCards(videos.filter(v =>
        v.snippet.title.toLowerCase().includes(q)
    ));
});

// ---------- PLAY PLAYLIST ----------
playPlaylistBtn.addEventListener('click', () => {
    if (!currentPlaylistName) return alert('Select a playlist first');
    const key = `playlist_${currentUser.username}_${currentPlaylistName}`;
    const videos = JSON.parse(localStorage.getItem(key)) || [];
    if (!videos.length) return alert('Playlist is empty');

    playFromIndex(videos, 0);
});

// ---------- PLAYER HELPERS ----------
function playFromIndex(videos, index) {
    currentVideosQueue = videos;
    currentVideoIndex = index;
    document.getElementById('playerWrapper').classList.remove('d-none');
    loadVideoByIndex(currentVideoIndex);
}

function loadVideoByIndex(index) {
    const video = currentVideosQueue[index];
    document.getElementById('nowPlaying').textContent =
    `Now Playing: ${decodeHtmlEntities(video.snippet.title)}`;

    if (!player) {
        player = new YT.Player('youtubePlayer', {
            videoId: video.id.videoId,
            playerVars: { autoplay: 1 },
            events: { onStateChange: onPlayerStateChange }
        });
    } else {
        player.loadVideoById(video.id.videoId);
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        currentVideoIndex++;
        if (currentVideoIndex < currentVideosQueue.length) {
            loadVideoByIndex(currentVideoIndex);
        } else {
            document.getElementById('nowPlaying').textContent = 'Playlist finished 🎵';
        }
    }
}

function decodeHtmlEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}