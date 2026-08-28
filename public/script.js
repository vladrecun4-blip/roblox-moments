let player = null;

document.addEventListener('DOMContentLoaded', () => {
  // Подключаем стильный плеер Plyr
  if (typeof Plyr !== 'undefined') {
    player = new Plyr('#plyrPlayer', {
      controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen']
    });
  }
  loadVideos();
});

function openModal() { 
  document.getElementById('uploadModal').style.display = 'flex'; 
}

function closeModal() { 
  document.getElementById('uploadModal').style.display = 'none'; 
}

// Всплывающее окно вместо перехода по ссылке
function openPlayer(videoUrl, title) {
  const modal = document.getElementById('playerModal');
  const videoElem = document.getElementById('plyrPlayer');

  document.getElementById('playerTitle').innerText = title;

  if (player) {
    player.source = {
      type: 'video',
      sources: [{ src: videoUrl, type: 'video/mp4' }]
    };
    player.play();
  } else {
    videoElem.src = videoUrl;
    videoElem.play();
  }

  modal.style.display = 'flex';
}

function closePlayer() {
  const modal = document.getElementById('playerModal');
  const videoElem = document.getElementById('plyrPlayer');

  if (player) {
    player.stop();
  } else {
    videoElem.pause();
    videoElem.src = '';
  }

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
      // Передаем ссылку и название в модалку (БЕЗ перенаправления!)
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
