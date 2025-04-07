const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

//Database setup
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Insecure database connected.');
        db.serialize(() => {
            db.run(`CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )`);
            //adding 4 mock users
            const users = [
                { email: 'user1@example.com', password: 'Password123!' },
                { email: 'user2@example.com', password: 'SecurePass456!' },
                { email: 'user3@example.com', password: 'MySafePass789!' },
                { email: 'user4@example.com', password: 'UltraSecure!000' }
            ];
            const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
            for (const user of users) {
                stmt.run(user.email, user.password);
            }
            stmt.finalize();
        });
    }
});

//Signup (No password hashing)
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, password], function (err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }
        res.send('User registered (insecure).');
    });
});

//Login (SQL injection)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`, (err, user) => {
        if (user) {
            res.send('Login successful (insecure).');
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

//Profile (XSS, SQL injection, no authentication)
app.get('/profile', (req, res) => {
    const email = req.query.email;
    //Gets the email from the response before any HTML tags
    const baseEmail = email.split('<')[0];
    
    db.get(`SELECT id, email, password FROM users WHERE email = ?`, [baseEmail], (err, user) => {
        if (err || !user) {
            return res.status(404).send('User not found.');
        }
        
        //Uses the email directly from the response (XSS)
        res.send(`
            <h1>Profile Information</h1>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${user.password}</p>
        `);
    });
});

// Start Server
app.listen(3000, () => console.log('Insecure app running on port 3000'));
