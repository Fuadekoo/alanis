# Secure OAuth SSO Integration Guide

## 🔒 Security Improvement

The OAuth system now uses a **secure code exchange mechanism** instead of sending tokens directly in URLs. This is much more secure!

## How It Works

1. **User authenticates** → System generates a temporary code (5-minute expiration)
2. **Redirect with code only** → User is redirected with just the code in URL
3. **Exchange code for token** → External system exchanges code for token via POST request
4. **Code is deleted** → Code can only be used once

## Integration Steps

### Step 1: Redirect User to OAuth Login

Same as before - redirect users to the OAuth login page:

```
https://your-domain.com/[lang]/oauth?callbackurl=https://external-system.com/callback
```

### Step 2: Handle the Callback

When the user is authenticated, they will be redirected to your callback URL with **only a code**:

```
https://external-system.com/callback?code=abc123def456...
```

**Important:** The code expires in 5 minutes and can only be used once!

### Step 3: Exchange Code for Token

Exchange the code for a token using a **POST request** (secure):

**POST /api/oauth/exchange-code**
```json
{
  "code": "abc123def456..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "username": "username",
    "firstName": "First",
    "fatherName": "Father",
    "lastName": "Last",
    "fullName": "First Father Last",
    "role": "student",
    "phoneNumber": "+1234567890",
    "country": "Country",
    "status": "active",
    "balance": 0,
    "age": 25,
    "gender": "Male"
  },
  "expiresIn": 86400
}
```

## Code Examples

### JavaScript/TypeScript

```javascript
// Handle callback
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) {
    console.error('No code received');
    return;
  }
  
  try {
    // Exchange code for token (POST request - secure!)
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
    const { token, user } = data;
    
    // Store token and user data securely
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    
    // Redirect to your app
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Token exchange error:', error);
    alert('Authentication failed. Please try again.');
  }
}

// Call this when page loads
handleCallback();
```

### PHP

```php
<?php
function handleCallback() {
    $code = $_GET['code'] ?? null;
    
    if (!$code) {
        die('No code received');
    }
    
    // Exchange code for token (POST request - secure!)
    $ch = curl_init('https://your-domain.com/api/oauth/exchange-code');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['code' => $code]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
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
    
    // Store token and user data securely
    $_SESSION['auth_token'] = $token;
    $_SESSION['user_data'] = $user;
    
    // Redirect to your app
    header("Location: /dashboard");
    exit;
}

// Call this when callback page loads
handleCallback();
?>
```

### Python (Flask)

```python
from flask import Flask, request, redirect, session
import requests
import json

app = Flask(__name__)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    
    if not code:
        return 'No code received', 400
    
    # Exchange code for token (POST request - secure!)
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
    
    # Store token and user data securely
    session['auth_token'] = token
    session['user_data'] = user
    
    return redirect('/dashboard')
```

## Security Benefits

✅ **No sensitive data in URLs** - Only a temporary code is sent  
✅ **One-time use codes** - Codes are deleted after exchange  
✅ **Short expiration** - Codes expire in 5 minutes  
✅ **POST request for token** - Token is sent via secure POST, not URL  
✅ **No token in browser history** - Tokens never appear in URLs  

## Error Handling

The exchange endpoint may return these errors:

- `invalid_request` - Code parameter missing
- `invalid_code` - Code not found or invalid
- `expired_code` - Code has expired (5 minutes)
- `code_already_used` - Code was already used
- `user_not_found` - User associated with code not found
- `server_error` - Internal server error

## Migration from Old Method

If you were using the old method (token in URL), update your callback handler:

**Old (Insecure):**
```javascript
const token = urlParams.get('token'); // ❌ Token in URL
const user = JSON.parse(urlParams.get('user')); // ❌ User data in URL
```

**New (Secure):**
```javascript
const code = urlParams.get('code'); // ✅ Only code in URL
// Exchange code for token via POST
const response = await fetch('/api/oauth/exchange-code', {
  method: 'POST',
  body: JSON.stringify({ code })
});
const { token, user } = await response.json(); // ✅ Token from POST
```

## Best Practices

1. **Exchange code immediately** - Don't store the code, exchange it right away
2. **Handle errors gracefully** - Show user-friendly error messages
3. **Validate token** - Use `/api/oauth/verify-token` to validate tokens
4. **Store tokens securely** - Use httpOnly cookies or secure storage
5. **Implement token refresh** - Tokens expire in 24 hours

Your OAuth system is now much more secure! 🔒

