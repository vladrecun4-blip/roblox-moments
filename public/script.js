let player = null;

document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем кастомный плеер Plyr
  player = new Plyr('#plyrPlayer', {
    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen']
  });

  loadVideos();
});

function openModal() { document.getElementById('uploadModal').style.display = 'flex'; }
function closeModal() { document.getElementById('uploadModal').style.display = 'none'; }

function openPlayer(videoUrl, title) {
  const modal = document.getElementById('playerModal');
  document.getElementById('playerTitle').innerText = title;

  // Загружаем новое видео в Plyr плеер
  player.source = {
    type: 'video',
    sources: [{ src: videoUrl, type: 'video/mp4' }]
  };

  modal.style.display = 'flex';
  player.play();
}

function closePlayer() {
  const modal = document.getElementById('playerModal');
  player.stop();
  modal.style.display = 'none';
}

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    const grid = document.getElementById('videoGrid');

    if (!videos || videos.length === 0) {
      grid.innerHTML = '<div class="empty-state">Пока нет загруженных роМоментов. Загрузи первый!</div>';
      return;
    }

    grid.innerHTML = '';
    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'card';
      card.onclick = () => openPlayer(v.videoUrl, v.title);
      card.innerHTML = `
        <div class="thumbnail-box">
          <img src="${v.thumbUrl}" alt="${v.title}">
          <div class="play-icon">▶</div>
        </div>
        <div class="info">
          <h3>${v.title}</h3>
          <p>🎮 ${v.category} • ${v.createdAt}</p>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Ошибка загрузки:', err);
  }
}

document.getElementById('uploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append('title', document.getElementById('videoTitle').value);
  formData.append('category', document.getElementById('videoCategory').value);
  formData.append('video', document.getElementById('videoFile').files[0]);
  formData.append('thumbnail', document.getElementById('thumbFile').files[0]);

  const btn = e.target.querySelector('button');
  btn.innerText = 'Загрузка...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (res.ok) {
      closeModal();
      this.reset();
      loadVideos();
    } else {
      alert('Ошибка при загрузке!');
    }
  } catch (err) {
    alert('Ошибка сервера');
  } finally {
    btn.innerText = 'Опубликовать';
    btn.disabled = false;
  }
});
