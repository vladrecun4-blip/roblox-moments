document.addEventListener('DOMContentLoaded', loadVideos);

function openModal() {
  document.getElementById('uploadModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('uploadModal').style.display = 'none';
}

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    const videos = await res.json();
    const grid = document.getElementById('videoGrid');

    if (videos.length === 0) {
      grid.innerHTML = '<div class="empty-state">Пока нет загруженных видео. Будь первым!</div>';
      return;
    }

    grid.innerHTML = '';
    videos.forEach(v => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <a href="${v.videoUrl}" target="_blank">
          <img src="${v.thumbUrl}" alt="${v.title}">
        </a>
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
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      closeModal();
      this.reset();
      loadVideos();
    } else {
      alert('Ошибка при загрузке!');
    }
  } catch (err) {
    alert('Сервер недоступен');
  } finally {
    btn.innerText = 'Опубликовать';
    btn.disabled = false;
  }
});
