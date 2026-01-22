# OAuth API Reference - Quick Reference

## 🔗 Endpoints

### 1. OAuth Login Page
**URL:** `GET /[lang]/oauth?callbackurl=YOUR_CALLBACK_URL`

**Parameters:**
- `lang`: `am` | `en` | `or`
- `callbackurl`: Your callback URL (URL encoded)

**Example:**
```
GET /en/oauth?callbackurl=https%3A%2F%2Fmyapp.com%2Fcallback
```

**Response:** HTML page (redirects to callback with code)

---

### 2. Exchange Code for Token
**URL:** `POST /api/oauth/exchange-code`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "code": "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
}
```

**Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHgxMjNhYmM0NTZkZWY3ODkiLCJ1c2VybmFtZSI6ImpvaG5fZG9lIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3MDAwMDAwMDB9.signature",
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

**Error Responses:**

**400 - Missing Code:**
```json
{
  "error": "invalid_request",
  "error_description": "Code is required"
}
```

**400 - Invalid Code:**
```json
{
  "error": "invalid_code",
  "error_description": "Invalid or expired code"
}
```

**400 - Expired Code:**
```json
{
  "error": "expired_code",
  "error_description": "Code has expired"
}
```

**400 - Code Already Used:**
```json
{
  "error": "code_already_used",
  "error_description": "Code has already been used"
}
```

**404 - User Not Found:**
```json
{
  "error": "user_not_found",
  "error_description": "User not found"
}
```

**500 - Server Error:**
```json
{
  "error": "server_error",
  "error_description": "An internal error occurred"
}
```

---

### 3. Verify Token (Optional)
**URL:** `POST /api/oauth/verify-token` or `GET /api/oauth/verify-token?token=TOKEN`

**Request Body (POST):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "valid": true,
  "token": {
    "sub": "clx123abc456def789",
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

**Error Response (401 Unauthorized):**
```json
{
  "valid": false,
  "error": "invalid_token",
  "error_description": "Token verification failed"
}
```

---

## 📋 User Object Fields

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | string | `"clx123abc456def789"` | Unique user ID |
| `username` | string | `"john_doe"` | Username |
| `firstName` | string | `"John"` | First name |
| `fatherName` | string | `"Michael"` | Father's name |
| `lastName` | string | `"Doe"` | Last name |
| `fullName` | string | `"John Michael Doe"` | Full name |
| `role` | string | `"student"` | User role |
| `phoneNumber` | string | `"+1234567890"` | Phone number |
| `country` | string | `"Ethiopia"` | Country |
| `status` | string | `"active"` | User status |
| `balance` | number | `5000` | Account balance |
| `age` | number | `25` | Age |
| `gender` | string | `"Male"` | Gender |

**Possible Role Values:**
- `manager`
- `scanner`
- `controller`
- `teacher`
- `student`
- `recordStudent`
- `recordTeacher`
- `reporter`

**Possible Status Values:**
- `new`
- `active`
- `inactive`

**Possible Gender Values:**
- `Male`
- `Female`

---

## ⏱️ Timing

- **Code Expiration:** 5 minutes (300 seconds)
- **Token Expiration:** 24 hours (86400 seconds)
- **Code Usage:** One-time use only

---

## 🔒 Security Notes

1. Codes expire in 5 minutes - exchange immediately
2. Codes can only be used once
3. Tokens expire in 24 hours
4. Always use HTTPS in production
5. Store tokens securely (httpOnly cookies recommended)

---

## 📝 Quick Integration Checklist

- [ ] Redirect user to OAuth page with callback URL
- [ ] Handle callback with code parameter
- [ ] Exchange code for token via POST request
- [ ] Store token securely
- [ ] Handle all error cases
- [ ] Implement token expiration logic
- [ ] Optional: Verify token periodically

---

## 🧪 Test Example

```bash
# 1. Get code from callback URL
# Callback: https://myapp.com/callback?code=abc123...

# 2. Exchange code for token
curl -X POST https://your-domain.com/api/oauth/exchange-code \
  -H "Content-Type: application/json" \
  -d '{"code":"abc123..."}'

# 3. Response
{
  "token": "eyJhbGci...",
  "user": { ... },
  "expiresIn": 86400
}
```

---

That's everything you need! 🚀

