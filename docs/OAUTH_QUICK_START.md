# OAuth SSO Quick Start Guide

## ✅ What's Been Implemented

Your OAuth Single Sign-On system is now fully functional! Here's what you have:

### Files Created:
- ✅ `app/[lang]/oauth/page.tsx` - OAuth login page
- ✅ `app/[lang]/oauth/layout.tsx` - Layout wrapper
- ✅ `app/api/oauth/generate-token/route.ts` - Token generation API
- ✅ `app/api/oauth/check-auth/route.ts` - Authentication check API
- ✅ `app/api/oauth/verify-token/route.ts` - Token verification API
- ✅ `middleware.ts` - Updated to allow OAuth routes

## 🚀 How to Use

### 1. From External System

Redirect users to your OAuth login page:

```
https://your-domain.com/[lang]/oauth?callbackurl=https://external-system.com/callback
```

**Example:**
```
https://your-domain.com/am/oauth?callbackurl=https://myapp.com/auth/callback
```

### 2. User Flow

1. **If user is NOT logged in:**
   - Shows login form
   - User enters credentials
   - After login, generates token and redirects

2. **If user IS already logged in:**
   - Automatically generates token
   - Immediately redirects to callback URL

### 3. Callback Response

After authentication, user is redirected to your callback URL with:

- `token` - JWT token (valid for 24 hours)
- `user` - JSON stringified user object

**Example callback URL:**
```
https://external-system.com/callback?token=eyJhbGci...&user={"id":"...","username":"...","role":"student",...}
```

## 📝 User Data Structure

```json
{
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
```

## 🔒 Token Verification

Verify tokens from external systems:

**POST /api/oauth/verify-token**
```json
{
  "token": "your-jwt-token"
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
  "user": { ... }
}
```

## ⚙️ Configuration

Make sure to set in your `.env` file:

```env
JWT_SECRET=your-strong-random-secret-key-here
```

## 🧪 Testing

1. **Test OAuth Login:**
   ```
   http://localhost:3000/am/oauth?callbackurl=http://localhost:3001/callback
   ```

2. **Test Token Generation:**
   - Login first
   - Call: `POST /api/oauth/generate-token`

3. **Test Token Verification:**
   - Get a token
   - Call: `POST /api/oauth/verify-token` with the token

## 🐛 Troubleshooting

### Issue: "Invalid callback URL"
- Make sure the callback URL is a valid URL format
- Example: `https://example.com/callback` ✅
- Example: `example.com/callback` ❌

### Issue: "Failed to generate token"
- Check if user is authenticated
- Check server logs for errors
- Verify JWT_SECRET is set

### Issue: Redirect not working
- Check browser console for errors
- Verify callback URL is accessible
- Check CORS settings if needed

## 📚 Full Documentation

See `docs/OAUTH_USAGE.md` for complete integration guide with code examples.

## ✨ Features

- ✅ Automatic redirect if already logged in
- ✅ Login form if not authenticated
- ✅ JWT token generation (24h expiration)
- ✅ Complete user data returned
- ✅ Token verification endpoint
- ✅ Error handling and validation
- ✅ Multi-language support (Amharic, English, Oromo)
- ✅ Secure cookie-based authentication

Your OAuth SSO system is ready to use! 🎉

