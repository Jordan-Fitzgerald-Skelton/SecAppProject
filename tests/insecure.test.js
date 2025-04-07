const { test, expect } = require('@playwright/test');

//Frontend test
test('Signup, login, and view profile', async ({ page }) => {
    await page.goto('http://127.0.0.1:4001/');

    //Signup
    await page.fill('#insecureSignupEmail', 'test@example.com');
    await page.fill('#insecureSignupPassword', 'password123');
    await page.click('#insecureSignupForm button');
    await page.waitForTimeout(1000);

    //Login
    await page.fill('#insecureEmail', 'test@example.com');
    await page.fill('#insecurePassword', 'password123');
    await page.click('#insecureLoginForm button');
    await page.waitForTimeout(1000); 

    //View profile
    await page.fill('#insecureProfileName', 'test@example.com');
    await page.click('button:has-text("View Profile")');
    await page.waitForTimeout(1000);

    const profileContent = await page.innerHTML('#insecureProfileResult');
    expect(profileContent).toContain('<h1>Profile Information</h1>');
});

test('Login fails with incorrect password', async ({ page }) => {
    await page.goto('http://127.0.0.1:4001/');

    await page.fill('#insecureEmail', 'test@example.com');
    await page.fill('#insecurePassword', 'wrongpassword');
    await page.click('#insecureLoginForm button');

    const alertMessage = await page.waitForEvent('dialog');
    expect(alertMessage.message()).toContain('Invalid credentials');
});

//Backend test
test('SQL Injection on login', async ({ request }) => {
    const response = await request.post('http://127.0.0.1:3000/login', {
        data: {
            email: "' OR 1=1 --",
            password: "anything"
        }
    });

    const responseBody = await response.text();
    console.log("SQLi Response:", responseBody);

    expect(responseBody).toContain('Login successful');
});

test('XSS in profile display', async ({ request }) => {
    await request.post('http://127.0.0.1:3000/register', {
        data: {
            email: '<script>alert("XSS")</script>',
            password: 'password123'
        }
    });

    const response = await request.get('http://127.0.0.1:3000/profile?email=<script>alert("XSS")</script>');
    const body = await response.text();

    expect(body).toContain('<script>alert("XSS")</script>');
    //because the frontend is running on http://127.0.0.1:3000 for the tests to execute 
    //no XSS scripts will execute. They will only be returned in the response. 
    //For XSS scripts to execute the index.html file needs to be opened directly  
});
