
// ---------- AUTH CHECK ----------
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
// const currentUser = JSON.parse(localStorage.getItem('currentUser')); //For tests: after - remove this and un-note line above
if (!currentUser) {
    window.location.href = "login.html";
}

if (!currentUser) {
    window.location.href = "login.html";
}

// ---------- SHOW USER INFO ----------
document.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('userInfo');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const userImage = document.getElementById('userImage');

    usernameDisplay.textContent = currentUser.username;
    userImage.src = currentUser.imageURL;
    userInfo.classList.remove('d-none');

    // Load search query from URL if exists
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
        document.getElementById('searchInput').value = query;
        searchVideos(query); // trigger search on page load
    }
});

// ---------- YOUTUBE API ----------
const API_KEY = "AIzaSyCrAMCoCgoJfkxWYCLZTR1giWkvXeh6S-U";
const resultsContainer = document.getElementById('results');

// Fetch video details (duration, views)
async function getVideoDetails(videoIds) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.items;
}

// ---------- FORMAT DURATION ----------
function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return isoDuration;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    const parts = [];
    if (hours > 0) parts.push(hours.toString());
    parts.push(hours > 0 ? String(minutes).padStart(2,'0') : minutes.toString());
    parts.push(String(seconds).padStart(2,'0'));
    return parts.join(':');
}

// ---------- UPDATE FAVORITE BUTTON STATE ----------
function updateFavoriteButtonState(video, card) {
    const playlistsKey = `playlists_${currentUser.username}`;
    const playlists = JSON.parse(localStorage.getItem(playlistsKey)) || [];

    let inAnyPlaylist = false;

    for (const pl of playlists) {
        const playlistVideosKey = `playlist_${currentUser.username}_${pl}`;
        const videos = JSON.parse(localStorage.getItem(playlistVideosKey)) || [];
        if (videos.some(v => v.id.videoId === video.id.videoId)) {
            inAnyPlaylist = true;
            break;
        }
    }

    const favBtn = card.querySelector('.add-fav-btn');

    if (inAnyPlaylist) {
        favBtn.classList.remove('btn-warning');
        favBtn.classList.add('btn-secondary');
        favBtn.innerHTML = '<i class="bi bi-check-circle-fill text-success fs-5 me-1"></i> Added';
    } else {
        favBtn.classList.remove('btn-secondary');
        favBtn.classList.add('btn-warning');
        favBtn.textContent = 'Add to favorites';
    }
}

// ---------- RENDER VIDEOS ----------
function renderVideos(videos, detailsMap) {
    resultsContainer.innerHTML = '';

    // Modal setup (once)
    const modalElement = document.getElementById('videoModal');
    const modalPlayer = document.getElementById('modalPlayer');
    const modalTitle = document.getElementById('modalTitle');
    const bsModal = new bootstrap.Modal(modalElement);

    modalElement.addEventListener('hide.bs.modal', () => {
        modalPlayer.src = '';
    });

    videos.forEach(video => {
        const detail = detailsMap[video.id.videoId];
        const title = video.snippet.title;
        const thumbnail = video.snippet.thumbnails.medium.url;
        const duration = detail ? formatDuration(detail.contentDetails.duration) : '';
        const views = detail ? Number(detail.statistics.viewCount).toLocaleString() : '';

        const card = document.createElement('div');
        card.className = "col-md-4";

        card.innerHTML = `
        <div class="card h-100">
            <img src="${thumbnail}" class="card-img-top play-trigger" alt="${title}" style="cursor:pointer;">
            <div class="card-body">
                <h5 class="card-title play-trigger" title="${title}" style="cursor:pointer;">${title}</h5>
                <p class="card-text">Duration: ${duration} | Views: ${views}</p>
                <button class="btn btn-sm btn-primary play-btn">Play</button>
                <button class="btn btn-sm add-fav-btn">Add to favorites</button>
            </div>
        </div>
        `;
        resultsContainer.appendChild(card);

        // Initialize favorite button
        updateFavoriteButtonState(video, card);

        // Favorite button opens playlist modal
        card.querySelector('.add-fav-btn').addEventListener('click', () => {
            window.currentVideoToAdd = video;
            loadPlaylists();
            bsPlaylistModal.show();
        });

        // Play button, image, title triggers
        const openModal = () => {
            modalTitle.textContent = title;
            modalPlayer.src = `https://www.youtube.com/embed/${video.id.videoId}?autoplay=1`;
            bsModal.show();
        };

        card.querySelector('.play-btn').addEventListener('click', openModal);
        card.querySelectorAll('.play-trigger').forEach(el => el.addEventListener('click', openModal));
    });
}

// ---------- SEARCH FUNCTION ----------
async function searchVideos(query) {
    if (!query) return;

    const params = new URLSearchParams();
    params.set('q', query);
    history.pushState({}, '', `${window.location.pathname}?${params}`);

    const cacheKey = `ytSearch_${query}`;
    let searchResults = JSON.parse(localStorage.getItem(cacheKey));

    if (!searchResults) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&videoEmbeddable=true&videoLicense=creativeCommon&key=${API_KEY}`;
        try {
            const res = await fetch(searchUrl);
            const data = await res.json();
            searchResults = data.items || [];
            localStorage.setItem(cacheKey, JSON.stringify(searchResults));
        } catch (err) {
            console.error("YouTube API error:", err);
            resultsContainer.innerHTML = `<p class="text-danger">Failed to fetch videos. Try again later.</p>`;
            return;
        }
    }

    if (searchResults.length === 0) {
        resultsContainer.innerHTML = `<p class="text-warning">No embeddable videos found for "${query}".</p>`;
        return;
    }

    const videoIds = searchResults.map(v => v.id.videoId);
    const details = await getVideoDetails(videoIds);
    const detailsMap = {};
    details.forEach(d => detailsMap[d.id] = d);

    renderVideos(searchResults, detailsMap);
}

// ---------- SEARCH FORM ----------
const form = document.getElementById('searchForm');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('searchInput').value.trim();
    searchVideos(query);
});

// ---------- PLAYLIST MODAL ----------
const playlistSelect = document.getElementById('playlistSelect');
const newPlaylistInput = document.getElementById('newPlaylistInput');
const saveToPlaylistBtn = document.getElementById('saveToPlaylistBtn');
const playlistModalEl = document.getElementById('playlistModal');
const bsPlaylistModal = new bootstrap.Modal(playlistModalEl);

function loadPlaylists() {
    const playlistsKey = `playlists_${currentUser.username}`;
    const playlists = JSON.parse(localStorage.getItem(playlistsKey)) || [];
    
    playlistSelect.innerHTML = '';
    playlists.forEach(pl => {
        const option = document.createElement('option');
        option.value = pl;
        option.textContent = pl;
        playlistSelect.appendChild(option);
    });
}

saveToPlaylistBtn.addEventListener('click', () => {
    const playlistsKey = `playlists_${currentUser.username}`;
    let playlists = JSON.parse(localStorage.getItem(playlistsKey)) || [];

    let playlistName = newPlaylistInput.value.trim();
    if (!playlistName) playlistName = playlistSelect.value;

    if (!playlistName) {
        alert("Please select or enter a playlist name");
        return;
    }

    // Add new playlist if it doesn't exist
    if (!playlists.includes(playlistName)) {
        playlists.push(playlistName);
        localStorage.setItem(playlistsKey, JSON.stringify(playlists));
    }

    const playlistVideosKey = `playlist_${currentUser.username}_${playlistName}`;
    let videos = JSON.parse(localStorage.getItem(playlistVideosKey)) || [];

    if (!videos.some(v => v.id.videoId === window.currentVideoToAdd.id.videoId)) {
        videos.push(window.currentVideoToAdd);
        localStorage.setItem(playlistVideosKey, JSON.stringify(videos));
    }

    // Update button on card with green check
    const cards = resultsContainer.querySelectorAll('.card');
    cards.forEach(card => {
        const titleEl = card.querySelector('.card-title');
        if (titleEl && titleEl.textContent === window.currentVideoToAdd.snippet.title) {
            updateFavoriteButtonState(window.currentVideoToAdd, card);
        }
    });

    // ----- SHOW TOAST -----
    const toastEl = document.getElementById('playlistToast');
    const toastPlaylistName = document.getElementById('toastPlaylistName');
    const toastPlaylistLink = document.getElementById('toastPlaylistLink');

    toastPlaylistName.textContent = playlistName;
    toastPlaylistLink.href = `playlists.html`;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    // Reset modal
    newPlaylistInput.value = '';
    bsPlaylistModal.hide();
});