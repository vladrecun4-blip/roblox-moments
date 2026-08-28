const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
// Важно для деплоя: PORT берётся из окружения хостинга (process.env.PORT)
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Раздаём файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Авто-создание папки uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

let videosDatabase = [];

app.get('/api/videos', (req, res) => {
  res.json(videosDatabase);
});

app.post('/api/upload', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, category } = req.body;
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const thumbFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

    if (!videoFile || !thumbFile) {
      return res.status(400).json({ error: 'Нужно выбрать и видео, и обложку' });
    }

    const newVideo = {
      id: Date.now().toString(),
      title: title || 'Без названия',
      category: category || 'other',
      videoUrl: `/uploads/${videoFile.filename}`,
      thumbUrl: `/uploads/${thumbFile.filename}`,
      createdAt: new Date().toLocaleDateString('ru-RU')
    };

    videosDatabase.unshift(newVideo);
    res.status(201).json({ message: 'Загружено!', video: newVideo });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер работает на порту ${PORT}`);
});