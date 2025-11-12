require('dotenv').config();
const express = require('express');
const db = require('./db');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // để load CSS
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3002;

// Khởi tạo bảng
const init = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};
init();

// 🏠 Trang chủ: danh sách + tìm kiếm
app.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    let result;
    if (search) {
      const q = `%${search}%`;
      result = await db.query(
        'SELECT * FROM posts WHERE title ILIKE $1 OR body ILIKE $1 ORDER BY created_at DESC',
        [q]
      );
    } else {
      result = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
    }
    res.render('index', { posts: result.rows, search });
  } catch (err) {
    res.send('Lỗi khi lấy danh sách bài viết');
  }
});

// 📝 Form thêm bài
app.get('/add', (req, res) => {
  res.render('form');
});

// Xử lý thêm bài
app.post('/add', async (req, res) => {
  try {
    const { title, body } = req.body;
    await db.query('INSERT INTO posts (title, body) VALUES ($1, $2)', [title, body]);
    res.redirect('/');
  } catch (err) {
    res.send('Không thể thêm bài viết');
  }
});

// 🛠 Form sửa bài
app.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
  res.render('edit', { post: result.rows[0] });
});

// Cập nhật bài viết
app.post('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { title, body } = req.body;
  await db.query('UPDATE posts SET title=$1, body=$2 WHERE id=$3', [title, body, id]);
  res.redirect('/');
});

// ❌ Xóa bài
app.get('/delete/:id', async (req, res) => {
  const id = req.params.id;
  await db.query('DELETE FROM posts WHERE id = $1', [id]);
  res.redirect('/');
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
