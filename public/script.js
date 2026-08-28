// === НАСТРОЙКИ SUPABASE (Вставь свои!) ===
const SUPABASE_URL = 'sb_publishable_ZRkQOtE_IaPpNoHxTbUPWA_wJejdpxL';
const SUPABASE_KEY = 'sb_secret_xg3jQK7qup3ffsVfyQD8CA_XhM7a8bq';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let player = null;
let currentAuthMode = 'login';

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof Plyr !== 'undefined') {
    player = new Plyr('#plyrPlayer', { controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'] });
  }

  checkUserSession();
  loadVideos();
});

// Переключение разделов (Главная / Профиль)
function showSection(section) {
  if (section === 'profile') {
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('profileSection').style.display = 'block';
    loadMyVideos();
  } else {
    document.getElementById('homeSection').style.display = 'block';
    document.getElementById('profileSection').style.display = 'none';
    loadVideos();
  }
}

// --- Авторизация ---
async function checkUserSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  const authBtns = document.getElementById('authButtons');
  const userNav = document.getElementById('userProfileNav');

  if (session) {
    authBtns.style.display = 'none';
    userNav.style.display = 'flex';
    const name = session.user.user_metadata.username || session.user.email;
    document.getElementById('navUsername').innerText = `👤 ${name}`;
    document.getElementById('profileEmail').innerText = session.user.email;
    document.getElementById('profileUsername').innerText = name;
  } else {
    authBtns.style.display = 'flex';
    userNav.style.display = 'none';
    showSection('home');
  }
}

function openAuthModal(mode) {
  currentAuthMode = mode;
  document.getElementById('authModal').style.display = 'flex';
  document.getElementById('authTitle').innerText = mode === 'login' ? 'Вход' : 'Регистрация';
  document.getElementById('usernameGroup').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('authBtnSubmit').innerText = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
}

function closeAuthModal() { document.getElementById('authModal').style.display = 'none'; }

document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const username = document.getElementById('authUsername').value;

  if (currentAuthMode === 'register') {
    const { error } = await _supabase.auth.signUp({
      email, password, options: { data: { username } }
    });
    if (error) return alert('Ошибка регистрации: ' + error.message);
    alert('Регистрация успешна! Войдите под своими данными.');
  } else {
    const { error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) return alert('Ошибка входа: ' + error.message);
  }

  closeAuthModal();
  checkUserSession();
});

async function logout() {
  await _supabase.auth.signOut();
  checkUserSession();
}

// --- Загрузка Видео ---
function openUploadModal() {
  _supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      alert('Сначала войдите в аккаунт или зарегистрируйтесь!');
      openAuthModal('login');
      return;
    }
    document.getElementById('uploadModal').style.display = 'flex';
  });
}
function closeUploadModal() { document.getElementById('uploadModal').style.display = 'none'; }

document.getElementById('uploadForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.innerText = 'Загрузка...';
  btn.disabled = true;

  try {
    const videoFile = document.getElementById('videoFile').files[0];
    const thumbFile = document.getElementById('thumbFile').files[0];
    const title = document.getElementById('videoTitle').value;
    const category = document.getElementById('videoCategory').value;

    const videoPath = `video_${Date.now()}.${videoFile.name.split('.').pop()}`;
    const thumbPath = `thumb_${Date.now()}.${thumbFile.name.split('.').pop()}`;

    // Файлы уходят в бакет 'videos'
    await _supabase.storage.from('videos').upload(videoPath, videoFile);
    await _supabase.storage.from('videos').upload(thumbPath, thumbFile);

    const videoUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${videoPath}`;
    const thumbUrl = `${SUPABASE_URL}/storage/v1/object/public/videos/${thumbPath}`;

    const { data: { session } } = await _supabase.auth.getSession();

    await _supabase.from('videos').insert([
      { title, category, video_url: videoUrl, thumb_url: thumbUrl, user_id: session.user.id }
    ]);

    closeUploadModal();
    this.reset();
    loadVideos();
  } catch (err) {
    alert('Ошибка при загрузке: ' + err.message);
  } finally {
    btn.innerText = 'Опубликовать в облако';
    btn.disabled = false;
  }
});

// --- Отображение видео на Главной ---
async function loadVideos() {
  const { data: videos } = await _supabase.from('videos').select('*').order('created_at', { ascending: false });
  renderVideoGrid('videoGrid', videos);
}

// --- Отображение видео в Профиле ---
async function loadMyVideos() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (!session) return;
  const { data: videos } = await _supabase.from('videos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
  renderVideoGrid('myVideoGrid', videos);
}

function renderVideoGrid(elementId, videos) {
  const grid = document.getElementById(elementId);
  if (!videos || videos.length === 0) {
    grid.innerHTML = '<div class="empty-state">Пока нет загруженных роМоментов.</div>';
    return;
  }
  grid.innerHTML = '';
  videos.forEach(v => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openPlayer(v.video_url, v.title);
    card.innerHTML = `
      <div class="thumbnail-box">
        <img src="${v.thumb_url}" alt="${v.title}">
        <div class="play-icon">▶</div>
      </div>
      <div class="info">
        <h3>${v.title}</h3>
        <p>🎮 ${v.category}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openPlayer(videoUrl, title) {
  document.getElementById('playerTitle').innerText = title;
  if (player) {
    player.source = { type: 'video', sources: [{ src: videoUrl, type: 'video/mp4' }] };
    player.play();
  }
  document.getElementById('playerModal').style.display = 'flex';
}

function closePlayer() {
  if (player) player.stop();
  document.getElementById('playerModal').style.display = 'none';
}
