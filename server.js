require('dotenv').config();
const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Khởi tạo bảng nếu chưa có
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
init().catch(err => {
  console.error('DB init error', err);
  process.exit(1);
});

// Create post
app.post('/posts', async (req, res) => {
  try {
    const { title, body } = req.body;
    const result = await db.query(
      'INSERT INTO posts (title, body) VALUES ($1, $2) RETURNING *',
      [title, body]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Không thể tạo post' });
  }
});

// Edit post
app.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body } = req.body;
    const result = await db.query(
      'UPDATE posts SET title = $1, body = $2 WHERE id = $3 RETURNING *',
      [title, body, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Không tìm thấy post' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Không thể cập nhật post' });
  }
});

// Delete post
app.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM posts WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Không tìm thấy post' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Không thể xóa post' });
  }
});

// Search posts: /posts?search=keyword
app.get('/posts', async (req, res) => {
  try {
    const { search } = req.query;
    if (search) {
      const q = `%${search}%`;
      const result = await db.query(
        'SELECT * FROM posts WHERE title ILIKE $1 OR body ILIKE $1 ORDER BY created_at DESC',
        [q]
      );
      return res.json(result.rows);
    } else {
      const result = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
      return res.json(result.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy posts' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
