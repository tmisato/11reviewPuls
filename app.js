
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

const con = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'rootroot',
database: 'review_db'
});

app.use(express.static('public'));

app.get('/', (req, res) => {
const sql = "SELECT ageGroup, rating, COUNT(*) AS count FROM (SELECT CASE WHEN age BETWEEN 0 AND 9 THEN '0-9' WHEN age BETWEEN 10 AND 19 THEN '10-19' WHEN age BETWEEN 20 AND 29 THEN '20-29' ELSE '30+' END AS ageGroup, rating FROM personas) AS groupedData GROUP BY ageGroup, rating";
con.query(sql, function (err, result, fields) {
if (err) throw err;

const ageData = result.map(row => ({
ageGroup: row.ageGroup,
rating: row.rating,
count: row.count
}));

const sql2 = "SELECT * FROM personas";
con.query(sql2, function (err, result, fields) {
if (err) throw err;

const users = result.map(row => ({
  id: row.id,
  rating: row.rating,
  username: row.username,
  age: row.age,
  reason: row.reason
}));

res.render('index', { users, ageData });
});
});
});

app.get('/age-data', (req, res) => {
const sql = "SELECT ageGroup, rating, COUNT(*) AS count FROM (SELECT CASE WHEN age BETWEEN 10 AND 19 THEN '10代' WHEN age BETWEEN 20 AND 29 THEN '20代' WHEN age BETWEEN 30 AND 39 THEN '30代' WHEN age BETWEEN 40 AND 49 THEN '40代' WHEN age >= 50 THEN '50代' ELSE 'その他' END AS ageGroup, rating FROM personas) AS groupedData GROUP BY ageGroup, rating";
con.query(sql, function (err, result, fields) {
if (err) throw err;

const ageData = result.map(row => ({
ageGroup: row.ageGroup,
rating: row.rating,
count: row.count
}));

res.json(ageData);
});
});



app.get('/sort-filter', (req, res) => {
  const { sort, filter } = req.query;

  let sql = "SELECT * FROM personas";

  if (filter !== 'all') {
    sql += ` WHERE rating = ${filter}`;
  }

  if (sort === 'high') {
    sql += " ORDER BY rating DESC";
  } else if (sort === 'low') {
    sql += " ORDER BY rating ASC";
  }

  con.query(sql, function (err, result, fields) {
    if (err) throw err;

    const users = result.map(row => ({
      id: row.id,
      rating: row.rating,
      username: row.username,
      age: row.age,
      reason: row.reason
    }));

    const sql2 = "SELECT age, COUNT(*) AS count FROM personas GROUP BY age";
    con.query(sql2, function (err, result, fields) {
      if (err) throw err;

      const ageData = result.map(row => ({
        age: row.age,
        count: row.count
      }));

      res.render('index', { users, ageData });
    });
  });
  

  
});
app.get('/users', getFilteredUsers);

function getFilteredUsers(req, res, next) {
  const filterBy = req.query.filter;

  let sql = 'SELECT * FROM personas';
  let params = [];

  if (filterBy && filterBy !== 'all') {
    sql += ' WHERE rating = ?';
    params.push(filterBy);
  }

  con.query(sql, params, function (err, result, fields) {
    if (err) {
      return next(err);
    }
    res.json(result);
  });
}


app.get('/create', (req, res) => {
res.sendFile(path.join(__dirname, 'html/form.html'));
});

app.get('/edit/:id', (req, res) => {
const id = req.params.id;
const sql = `SELECT * FROM personas WHERE id = ?`;
const values = [id];

con.query(sql, values, function (err, result, fields) {
if (err) throw err;
res.render('edit', { user: result[0] });
});
});

app.post('/edit/:id', (req, res) => {
const id = req.params.id;
const { username, age, rating, reason } = req.body;
const sql = `UPDATE personas SET username = ?, age = ?, rating = ?, reason = ? WHERE id = ?`;
const values = [username, age, rating, reason, id];

con.query(sql, values, function (err, result, fields) {
if (err) throw err;
res.redirect('/');
});
});

app.listen(port, () => {
console.log(`App listening at http://localhost:${port}`);
});
