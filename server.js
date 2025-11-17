require('dotenv').config();
const express = require('express');
const db = require('./db');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3002;

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

app.get('/', async (req, res) => {
    try {
      const search = req.query.search || '';
      const sort = req.query.sort || 'newest'; 
      let query = 'SELECT * FROM posts';
      const params = [];

      if (search) {
        query += ' WHERE title ILIKE $1 OR body ILIKE $1';
        params.push(`%${search}%`);
      }

      if (sort === 'id_asc') {
        query += ' ORDER BY id ASC';
      } else if (sort === 'id_desc') {
        query += ' ORDER BY id DESC';
      } else if (sort === 'newest') {
        query += ' ORDER BY created_at DESC';
      } else if (sort === 'oldest') {
        query += ' ORDER BY created_at ASC';
      }
  
      const result = await db.query(query, params);
      res.render('index', { posts: result.rows, search, sort });
    } catch (err) {
      console.error(err);
      res.send('Lỗi khi lấy danh sách bài viết');
    }
  });  

app.get('/add', (req, res) => {
  res.render('form');
});

app.post('/add', async (req, res) => {
  try {
    const { title, body } = req.body;
    await db.query('INSERT INTO posts (title, body) VALUES ($1, $2)', [title, body]);
    res.redirect('/');
  } catch (err) {
    res.send('Không thể thêm bài viết');
  }
});

app.get('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const result = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
  res.render('edit', { post: result.rows[0] });
});

app.post('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { title, body } = req.body;
  await db.query('UPDATE posts SET title=$1, body=$2 WHERE id=$3', [title, body, id]);
  res.redirect('/');
});

app.get('/delete/:id', async (req, res) => {
  const id = req.params.id;
  await db.query('DELETE FROM posts WHERE id = $1', [id]);
  res.redirect('/');
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
