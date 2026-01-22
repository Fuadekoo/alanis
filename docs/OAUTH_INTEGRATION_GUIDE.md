# OAuth SSO Integration Guide - Complete Reference

## 📋 Overview

This guide shows you exactly how to integrate the OAuth SSO system into your external application, including all request/response formats.

## 🔄 Complete Flow

```
1. User clicks "Login with SSO" in your app
   ↓
2. Redirect user to: https://your-domain.com/[lang]/oauth?callbackurl=YOUR_CALLBACK_URL
   ↓
3. User authenticates (or is already authenticated)
   ↓
4. User redirected to: YOUR_CALLBACK_URL?code=TEMPORARY_CODE
   ↓
5. Your app exchanges code for token: POST /api/oauth/exchange-code
   ↓
6. Receive token and user data
   ↓
7. User is logged into your system
```

---

## 📥 Step-by-Step Integration

### Step 1: Redirect User to OAuth Login

**URL Format:**
```
https://your-domain.com/[lang]/oauth?callbackurl=YOUR_ENCODED_CALLBACK_URL
```

**Parameters:**
- `lang` (required): Language code - `am` (Amharic), `en` (English), or `or` (Oromo)
- `callbackurl` (required): Your callback URL where user will be redirected after authentication

**Example:**
```javascript
// JavaScript
const callbackUrl = encodeURIComponent('https://myapp.com/auth/callback');
const oauthUrl = `https://your-domain.com/en/oauth?callbackurl=${callbackUrl}`;
window.location.href = oauthUrl;
```

```php
// PHP
$callbackUrl = urlencode('https://myapp.com/auth/callback');
$oauthUrl = "https://your-domain.com/en/oauth?callbackurl=" . $callbackUrl;
header("Location: " . $oauthUrl);
exit;
```

---

### Step 2: Handle Callback - Receive Code

When user is authenticated, they will be redirected to your callback URL with a **code** parameter:

**Callback URL:**
```
https://myapp.com/auth/callback?code=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**Important:**
- Code expires in **5 minutes**
- Code can only be used **once**
- Code is **NOT** the token - you must exchange it

---

### Step 3: Exchange Code for Token

**Endpoint:** `POST /api/oauth/exchange-code`

**Request:**
```http
POST https://your-domain.com/api/oauth/exchange-code
Content-Type: application/json

{
  "code": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
}
```

**Response (Success - 200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwidXNlcm5hbWUiOiJqb2huX2RvZSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzAwMDAwMDAwfQ.signature",
  "user": {
    "id": "clx123abc456def789",
    "username": "john_doe",
    "firstName": "John",
    "fatherName": "Michael",
    "lastName": "Doe",
    "fullName": "John Michael Doe",
    "role": "student",
    "phoneNumber": "+1234567890",
    "country": "Ethiopia",
    "status": "active",
    "balance": 5000,
    "age": 25,
    "gender": "Male"
  },
  "expiresIn": 86400
}
```

**Response Fields:**
- `token` (string): JWT token valid for 24 hours
- `user` (object): Complete user information
- `expiresIn` (number): Token expiration time in seconds (86400 = 24 hours)

**Error Responses:**

**400 Bad Request - Invalid Code:**
```json
{
  "error": "invalid_code",
  "error_description": "Invalid or expired code"
}
```

**400 Bad Request - Expired Code:**
```json
{
  "error": "expired_code",
  "error_description": "Code has expired"
}
```

**400 Bad Request - Code Already Used:**
```json
{
  "error": "code_already_used",
  "error_description": "Code has already been used"
}
```

**400 Bad Request - Missing Code:**
```json
{
  "error": "invalid_request",
  "error_description": "Code is required"
}
```

**404 Not Found - User Not Found:**
```json
{
  "error": "user_not_found",
  "error_description": "User not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "server_error",
  "error_description": "An internal error occurred"
}
```

---

## 💻 Complete Code Examples

### JavaScript/TypeScript (React/Next.js/Vue)

```javascript
// 1. Redirect to OAuth
function redirectToSSO() {
  const callbackUrl = encodeURIComponent('https://myapp.com/auth/callback');
  const oauthUrl = `https://your-domain.com/en/oauth?callbackurl=${callbackUrl}`;
  window.location.href = oauthUrl;
}

// 2. Handle callback
async function handleOAuthCallback() {
  // Get code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) {
    console.error('No authorization code received');
    // Handle error - maybe redirect to login page
    return;
  }
  
  try {
    // Exchange code for token
    const response = await fetch('https://your-domain.com/api/oauth/exchange-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to exchange code');
    }
    
    const data = await response.json();
    const { token, user, expiresIn } = data;
    
    // Store token securely (use httpOnly cookies in production)
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    localStorage.setItem('token_expires', Date.now() + (expiresIn * 1000));
    
    // Redirect to your app
    window.location.href = '/dashboard';
    
  } catch (error) {
    console.error('OAuth error:', error);
    alert('Authentication failed. Please try again.');
    // Redirect to login
    window.location.href = '/login';
  }
}

// Call on callback page load
if (window.location.pathname === '/auth/callback') {
  handleOAuthCallback();
}
```

### PHP

```php
<?php
session_start();

// 1. Redirect to OAuth
function redirectToSSO() {
    $callbackUrl = urlencode('https://myapp.com/auth/callback.php');
    $oauthUrl = "https://your-domain.com/en/oauth?callbackurl=" . $callbackUrl;
    header("Location: " . $oauthUrl);
    exit;
}

// 2. Handle callback (callback.php)
function handleOAuthCallback() {
    $code = $_GET['code'] ?? null;
    
    if (!$code) {
        die('No authorization code received');
    }
    
    // Exchange code for token
    $ch = curl_init('https://your-domain.com/api/oauth/exchange-code');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['code' => $code]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        $error = json_decode($response, true);
        die('Authentication failed: ' . ($error['error_description'] ?? 'Unknown error'));
    }
    
    $data = json_decode($response, true);
    $token = $data['token'];
    $user = $data['user'];
    $expiresIn = $data['expiresIn'];
    
    // Store in session
    $_SESSION['auth_token'] = $token;
    $_SESSION['user_data'] = $user;
    $_SESSION['token_expires'] = time() + $expiresIn;
    
    // Redirect to dashboard
    header("Location: /dashboard.php");
    exit;
}

// Handle callback
if (isset($_GET['code'])) {
    handleOAuthCallback();
}
?>
```

### Python (Flask)

```python
from flask import Flask, request, redirect, session, url_for
import requests
import json
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# 1. Redirect to OAuth
@app.route('/login/sso')
def login_sso():
    callback_url = 'https://myapp.com/auth/callback'
    oauth_url = f'https://your-domain.com/en/oauth?callbackurl={callback_url}'
    return redirect(oauth_url)

# 2. Handle callback
@app.route('/auth/callback')
def oauth_callback():
    code = request.args.get('code')
    
    if not code:
        return 'No authorization code received', 400
    
    # Exchange code for token
    response = requests.post(
        'https://your-domain.com/api/oauth/exchange-code',
        json={'code': code},
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code != 200:
        error = response.json()
        return f"Authentication failed: {error.get('error_description', 'Unknown error')}", 400
    
    data = response.json()
    token = data['token']
    user = data['user']
    expires_in = data['expiresIn']
    
    # Store in session
    session['auth_token'] = token
    session['user_data'] = user
    session['token_expires'] = (datetime.now() + timedelta(seconds=expires_in)).timestamp()
    
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    if 'auth_token' not in session:
        return redirect(url_for('login_sso'))
    
    user = session['user_data']
    return f"Welcome, {user['fullName']}!"
```

### Python (Django)

```python
from django.shortcuts import redirect
from django.http import JsonResponse
import requests
import json

# 1. Redirect to OAuth
def login_sso(request):
    callback_url = 'https://myapp.com/auth/callback'
    oauth_url = f'https://your-domain.com/en/oauth?callbackurl={callback_url}'
    return redirect(oauth_url)

# 2. Handle callback
def oauth_callback(request):
    code = request.GET.get('code')
    
    if not code:
        return JsonResponse({'error': 'No authorization code'}, status=400)
    
    # Exchange code for token
    response = requests.post(
        'https://your-domain.com/api/oauth/exchange-code',
        json={'code': code},
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code != 200:
        error = response.json()
        return JsonResponse({'error': error.get('error_description')}, status=400)
    
    data = response.json()
    token = data['token']
    user = data['user']
    
    # Store in session
    request.session['auth_token'] = token
    request.session['user_data'] = user
    
    return redirect('dashboard')
```

### Node.js/Express

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

// 1. Redirect to OAuth
app.get('/login/sso', (req, res) => {
  const callbackUrl = encodeURIComponent('https://myapp.com/auth/callback');
  const oauthUrl = `https://your-domain.com/en/oauth?callbackurl=${callbackUrl}`;
  res.redirect(oauthUrl);
});

// 2. Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  
  try {
    // Exchange code for token
    const response = await axios.post(
      'https://your-domain.com/api/oauth/exchange-code',
      { code },
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const { token, user, expiresIn } = response.data;
    
    // Store in session (use secure session storage in production)
    req.session.auth_token = token;
    req.session.user_data = user;
    req.session.token_expires = Date.now() + (expiresIn * 1000);
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    res.status(400).send('Authentication failed');
  }
});
```

---

## 🔐 Token Verification (Optional)

You can verify tokens to ensure they're still valid:

**Endpoint:** `POST /api/oauth/verify-token`

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "valid": true,
  "token": {
    "sub": "user-id",
    "username": "john_doe",
    "role": "student",
    "issued_at": 1700000000,
    "expires_at": 1700086400
  },
  "user": {
    "id": "clx123abc456def789",
    "username": "john_doe",
    "firstName": "John",
    "fatherName": "Michael",
    "lastName": "Doe",
    "fullName": "John Michael Doe",
    "role": "student",
    "phoneNumber": "+1234567890",
    "country": "Ethiopia",
    "status": "active",
    "balance": 5000,
    "age": 25,
    "gender": "Male"
  }
}
```

---

## 📊 User Data Structure

The `user` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique user ID |
| `username` | string | Username |
| `firstName` | string | First name |
| `fatherName` | string | Father's name |
| `lastName` | string | Last name |
| `fullName` | string | Full name (firstName + fatherName + lastName) |
| `role` | string | User role: `manager`, `scanner`, `controller`, `teacher`, `student`, `recordStudent`, `recordTeacher`, `reporter` |
| `phoneNumber` | string | Phone number |
| `country` | string | Country |
| `status` | string | User status: `new`, `active`, `inactive` |
| `balance` | number | Account balance |
| `age` | number | Age |
| `gender` | string | Gender: `Male` or `Female` |

---

## ⚠️ Important Security Notes

1. **Never expose tokens in URLs** - Always use POST requests
2. **Store tokens securely** - Use httpOnly cookies or secure storage
3. **Validate tokens** - Use the verify endpoint periodically
4. **Handle expiration** - Tokens expire in 24 hours
5. **Use HTTPS** - Always use HTTPS in production
6. **Code expiration** - Codes expire in 5 minutes, exchange immediately

---

## 🧪 Testing

### Test OAuth Flow:
```
1. Visit: http://localhost:3000/en/oauth?callbackurl=http://localhost:3001/callback
2. Login (or if already logged in, you'll be redirected automatically)
3. You'll be redirected to: http://localhost:3001/callback?code=...
4. Exchange the code for token
5. Use the token in your application
```

### Test Token Exchange:
```bash
curl -X POST https://your-domain.com/api/oauth/exchange-code \
  -H "Content-Type: application/json" \
  -d '{"code":"your-code-here"}'
```

---

## 📝 Summary

1. **Redirect user** to OAuth page with callback URL
2. **Receive code** in callback URL parameter
3. **Exchange code** for token via POST request
4. **Store token** securely
5. **Use token** to authenticate API requests
6. **Verify token** periodically if needed

That's it! Your integration is complete! 🎉

