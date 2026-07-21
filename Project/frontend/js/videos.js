const YOUTUBE_API_KEY = 'AIzaSyC6nwjbqtQ-iGADr9ydsr0fyRlwHPfxltA';
const CHANNEL_ID = 'UCj8H1ZZe0HZYtsXn8PsUn9w';
const CACHE_KEY = 'jks_youtube_videos_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function loadVideos() {
  const grid = document.getElementById('videosGrid');
  let videos = getCachedVideos();

  if (!videos && YOUTUBE_API_KEY && CHANNEL_ID) {
    videos = await fetchYouTubeVideos();
    if (videos) cacheVideos(videos);
  }

  if (!videos || videos.length === 0) {
    grid.innerHTML = '<div class="schedule-loading">Видео пока не загружены</div>';
    return;
  }

  grid.innerHTML = videos.map(v => `
    <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener noreferrer" class="video-card">
      <div class="video-thumb">
        <div class="video-play-overlay"><i class="fas fa-play"></i></div>
        <img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy">
      </div>
      <div class="video-card-body">
        <h3 class="video-card-title">${v.title}</h3>
      </div>
    </a>
  `).join('');
}

function getCachedVideos() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheVideos(videos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: videos,
      expiry: Date.now() + CACHE_TTL
    }));
  } catch {}
}

async function fetchYouTubeVideos() {
  try {
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&id=${CHANNEL_ID}&part=contentDetails`
    );
    const chData = await chRes.json();
    if (chData.error || !chData.items || !chData.items[0]) return null;
    const uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads;

    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=6`
    );
    const plData = await plRes.json();
    if (plData.error || !plData.items) return null;

    return plData.items.map(i => ({
      id: i.snippet.resourceId.videoId,
      title: i.snippet.title
    }));
  } catch (err) {
    return null;
  }
}
