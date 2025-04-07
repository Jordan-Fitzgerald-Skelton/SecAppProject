const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const xssClean = require('xss-clean');
const dotenv = require('dotenv');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const xss = require('xss');

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

//Express
const app = express();
app.use(bodyParser.json());
app.use(helmet());
app.use(xssClean());
app.use(cors());

//Database setup
const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Secure database connected.');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`);
    //created 4 mock users
    const users = [
        { email: 'user1@example.com', password: 'Password123!' },
        { email: 'user2@example.com', password: 'SecurePass456!' },
        { email: 'user3@example.com', password: 'MySafePass789!' },
        { email: 'user4@example.com', password: 'UltraSecure!000' }
    ];
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    //adds all users with encrypted passwords
    (async () => {
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            stmt.run(user.email, hashedPassword);
        }
        stmt.finalize();
    })();
});

//Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: 'secure.log',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(info => {
                    const sanitizedInfo = { ...info };
                    delete sanitizedInfo.headers?.authorization;
                    delete sanitizedInfo.body?.password;
                    return JSON.stringify(sanitizedInfo);
                })
            )
        })
    ]
});

//Authentication Middleware (JWT checks)
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Access denied. No token provided.');

    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid token.');
        req.user = user;
        next();
    });
};

//Input sanitization
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            req.body[key] = xss(req.body[key]);
        }
    }
    next();
};

//Validate emails
const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email).toLowerCase());
};

app.use(sanitizeInput);
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

//Signup
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !validateEmail(email)) {
        return res.status(400).send('Invalid credentials');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], (err) => {
        if (err) return res.status(500).send('Error registering user.');
        res.send('User registered securely.');
    });
});

//Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !validateEmail(email)) {
        return res.status(400).send('Invalid credentials');
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

//Profile
app.get('/profile', authenticateToken, (req, res) => {
    db.get('SELECT id, email, password FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).send('User not found.');
        }
        const maskedEmail = user.email.replace(/^(.{2}).*(@.*)$/, '$1*****$2');
        res.json({
            id: user.id,
            email: maskedEmail
        });
    });
});

// Start the server
app.listen(4000, () => console.log('Secure app running on port 4000'));
