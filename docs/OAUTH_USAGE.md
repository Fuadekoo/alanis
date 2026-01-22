# OAuth Single Sign-On (SSO) Integration Guide

This system provides a simple OAuth-based Single Sign-On (SSO) solution that allows external systems to authenticate users and receive user data with a token.

## How It Works

1. External system redirects user to the OAuth login page with a callback URL
2. If user is not logged in, they see a login form
3. If user is already logged in, they are automatically redirected
4. After authentication, the system generates a JWT token and redirects to the callback URL with token and user data

## Integration Steps

### Step 1: Redirect User to OAuth Login

Redirect users to the OAuth login page with a `callbackurl` parameter:

```
https://your-domain.com/[lang]/oauth?callbackurl=https://your-external-system.com/callback
```

**Parameters:**
- `lang` (required): Language code (`am`, `en`, or `or`)
- `callbackurl` (required): URL where the user should be redirected after authentication

**Example:**
```
https://your-domain.com/am/oauth?callbackurl=https://external-app.com/auth/callback
```

### Step 2: Handle the Callback

When the user is authenticated, they will be redirected to your callback URL with the following query parameters:

- `token`: JWT token containing user information
- `user`: JSON stringified user object

**Example callback URL:**
```
https://external-app.com/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...&user={"id":"...","username":"...","firstName":"...","role":"..."}
```

### Step 3: Verify the Token (Optional)

You can verify the token by calling the verify endpoint:

**POST /api/oauth/verify-token**
```json
{
  "token": "your-jwt-token-here"
}
```

**Response:**
```json
{
  "valid": true,
  "token": {
    "sub": "user-id",
    "username": "username",
    "role": "student",
    "issued_at": 1234567890,
    "expires_at": 1234654290
  },
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
  }
}
```

**GET /api/oauth/verify-token?token=your-jwt-token-here**

Same as POST but using GET method.

## User Data Structure

The user object contains the following fields:

```typescript
{
  id: string;              // User unique ID
  username: string;        // Username
  firstName: string;       // First name
  fatherName: string;      // Father's name
  lastName: string;        // Last name
  fullName: string;        // Full name (firstName + fatherName + lastName)
  role: string;            // User role (manager, scanner, controller, teacher, student, etc.)
  phoneNumber: string;     // Phone number
  country: string;          // Country
  status: string;          // User status (new, active, inactive)
  balance: number;         // Account balance
  age: number;             // Age
  gender: string;          // Gender (Male, Female)
}
```

## Token Information

- **Type**: JWT (JSON Web Token)
- **Expiration**: 24 hours
- **Algorithm**: HS256
- **Secret**: Set via `JWT_SECRET` environment variable

## Example Implementation

### JavaScript/TypeScript

```javascript
// Redirect user to OAuth login
function redirectToSSO(callbackUrl) {
  const oauthUrl = `https://your-domain.com/am/oauth?callbackurl=${encodeURIComponent(callbackUrl)}`;
  window.location.href = oauthUrl;
}

// Handle callback
function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userJson = urlParams.get('user');
  
  if (token && userJson) {
    const user = JSON.parse(userJson);
    
    // Store token and user data
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', userJson);
    
    // Redirect to your app
    window.location.href = '/dashboard';
  }
}

// Verify token
async function verifyToken(token) {
  const response = await fetch('https://your-domain.com/api/oauth/verify-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
  
  const data = await response.json();
  return data;
}
```

### PHP

```php
<?php
// Redirect user to OAuth login
function redirectToSSO($callbackUrl) {
    $oauthUrl = "https://your-domain.com/am/oauth?callbackurl=" . urlencode($callbackUrl);
    header("Location: " . $oauthUrl);
    exit;
}

// Handle callback
function handleCallback() {
    $token = $_GET['token'] ?? null;
    $userJson = $_GET['user'] ?? null;
    
    if ($token && $userJson) {
        $user = json_decode($userJson, true);
        
        // Store token and user data
        $_SESSION['auth_token'] = $token;
        $_SESSION['user_data'] = $user;
        
        // Redirect to your app
        header("Location: /dashboard");
        exit;
    }
}

// Verify token
function verifyToken($token) {
    $ch = curl_init('https://your-domain.com/api/oauth/verify-token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['token' => $token]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}
?>
```

## Security Considerations

1. **Always use HTTPS** in production
2. **Validate the token** on your server side before trusting user data
3. **Set JWT_SECRET** environment variable to a strong, random secret
4. **Verify the callback URL** belongs to your domain to prevent open redirects
5. **Token expiration**: Tokens expire after 24 hours, implement refresh logic if needed

## Error Handling

If authentication fails or an error occurs, the user will see an error message. Make sure your callback URL can handle cases where the token or user data is missing.

## Support

For issues or questions, please contact the system administrator.

