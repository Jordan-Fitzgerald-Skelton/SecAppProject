const { test, expect } = require('@playwright/test');

const BACKEND_URL = 'http://localhost:4000';
const FRONTEND_URL = 'http://localhost:5001';

let Token = '';

//Frontend tests
test('User can register with valid credentials', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    const email = `test${Date.now()}@example.com`;

    await page.fill('#secureSignupEmail', email);
    await page.fill('#secureSignupPassword', 'Password123!');
    await page.click('#secureSignupForm button');

    const alert = await page.waitForEvent('dialog');
    expect(alert.message()).toContain('User registered');
    await alert.accept();
});

test('User can login with valid credentials', async ({ page }) => {
    await page.goto(FRONTEND_URL);

    await page.fill('#secureEmail', 'user1@example.com');
    await page.fill('#securePassword', 'Password123!');
    await page.click('#secureLoginForm button');

    const alert = await page.waitForEvent('dialog');
    expect(alert.message()).toContain('Login successful');
    await alert.accept();

    await expect(page.locator('#viewProfileButton')).toBeVisible();
});

test('User can view profile after login', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.fill('#secureEmail', 'user1@example.com');
    await page.fill('#securePassword', 'Password123!');
    await page.click('#secureLoginForm button');
    const alert = await page.waitForEvent('dialog');
    await alert.accept();

    await page.click('#viewProfileButton');

    await expect(page.locator('#secureProfileResult')).toContainText('ID:');
    await expect(page.locator('#secureProfileResult')).toContainText('Email:');
});

test('User can logout successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.fill('#secureEmail', 'user1@example.com');
    await page.fill('#securePassword', 'Password123!');
    await page.click('#secureLoginForm button');
    const loginalert = await page.waitForEvent('dialog');
    expect(loginalert.message()).toContain('Login successful');
    await loginalert.accept();

    await page.click('#logoutButton');

    await expect(page.locator('#viewProfileButton')).toBeHidden();
    await expect(page.locator('#logoutButton')).toBeHidden();
});

//Backend tests
test('Signup should hash password and store user securely', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/register`, {
        data: {
            email: 'secureuser@example.com',
            password: 'SecurePass123!'
        }
    });
    const body = await response.text();
    expect(body).toContain('User registered securely.');
});

test('Login should succeed and return a JWT token', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/login`, {
        data: {
            email: 'secureuser@example.com',
            password: 'SecurePass123!'
        }
    });
    const body = await response.json();
    expect(body).toHaveProperty('token');
    Token = body.token;
});

test('SQL Injection should not bypass authentication', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/login`, {
        data: {
            email: "injection@example.com' OR 1=1 --",
            password: "anything"
        }
    });
    const body = await response.text();
    expect(body).toContain('Invalid credentials');
});

test('XSS attempt in profile should be sanitized', async ({ request }) => {
    await request.post(`${BACKEND_URL}/register`, {
        data: {
            email: 'xss@example.com',
            password: 'password123',
            displayName: '<script>alert("XSS")</script>'
        }
    });
    const loginResponse = await request.post(`${BACKEND_URL}/login`, {
        data: {
            email: 'xss@example.com',
            password: 'password123'
        }
    });
    const xssToken = (await loginResponse.json()).token;
    const response = await request.get(`${BACKEND_URL}/profile`, {
        headers: { Authorization: `Bearer ${xssToken}` }
    });
    const body = await response.text();
    expect(body).not.toContain('<script>alert("XSS")</script>');
});

test('Profile should require authentication', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/profile`);

    expect(response.status()).toBe(403);
});

test('Profile should mask email', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/profile`, {
        headers: { Authorization: `Bearer ${Token}` }
    });

    const body = await response.json();
    expect(body.email).toContain('*****');
});

test('Invalid email format should be rejected', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/register`, {
        data: {
            email: 'not-an-email',
            password: 'password123'
        }
    });
    expect(response.status()).toBe(400);
    const body = await response.text();
    expect(body).toContain('Invalid credentials');
});
