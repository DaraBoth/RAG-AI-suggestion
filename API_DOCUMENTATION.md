# 🔐 API Documentation

Welcome to the TypeFlow AI API! This document provides everything you need to integrate our intelligent autocomplete and chat features into your applications.

## 🚀 Getting Started

### 1. Generate an API Key

First, you need to generate an API key to authenticate your requests.

**Endpoint:** `POST /api/keys/generate`

**Request Body:**
```json
{
  "name": "My Application",
  "rateLimit": 1000,
  "allowedEndpoints": ["complete-word", "suggest-phrase", "chat"],
  "expiresInDays": 365,
  "metadata": {
    "email": "your@email.com",
    "company": "Your Company"
  }
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": "tk_live_XyZ123AbC456...",
  "keyInfo": {
    "id": "uuid",
    "name": "My Application",
    "keyPrefix": "tk_live_XyZ123",
    "rateLimit": 1000,
    "allowedEndpoints": ["complete-word", "suggest-phrase", "chat"],
    "expiresAt": "2027-01-30T00:00:00Z",
    "createdAt": "2026-01-30T00:00:00Z"
  },
  "warning": "⚠️ Store this API key securely. It will not be shown again!"
}
```

**⚠️ IMPORTANT:** Save your API key securely! It will only be shown once.

### 2. Authentication

All public API endpoints require authentication using your API key.

**Authentication Header:**
```
Authorization: Bearer tk_live_YOUR_API_KEY
```

---

## 📡 API Endpoints

### 1. Word Completion

Get intelligent word completion suggestions based on context.

**Endpoint:** `POST /api/public/complete-word`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "I love to eat",
  "incompleteWord": "app",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    { "text": "apples", "type": "word" },
    { "text": "appetizers", "type": "word" },
    { "text": "application", "type": "word" }
  ],
  "count": 3,
  "metadata": {
    "responseTime": "245ms",
    "apiVersion": "1.0"
  }
}
```

**Parameters:**
- `text` (string, required): The current text context
- `incompleteWord` (string, required): The word being typed
- `limit` (number, optional): Max suggestions (default: 5, max: 10)

---

### 2. Phrase Suggestion

Get smart phrase suggestions to continue your text.

**Endpoint:** `POST /api/public/suggest-phrase`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Machine learning is ",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "suggestions": [
    { "text": "a subset of artificial intelligence", "type": "phrase" },
    { "text": "revolutionizing how we process data", "type": "phrase" },
    { "text": "becoming increasingly important", "type": "phrase" }
  ],
  "count": 3,
  "metadata": {
    "responseTime": "312ms",
    "apiVersion": "1.0"
  }
}
```

**Parameters:**
- `text` (string, required): The current text context
- `limit` (number, optional): Max suggestions (default: 5, max: 10)

---

### 3. AI Chat

Chat with the AI using your trained knowledge base.

**Endpoint:** `POST /api/public/chat`

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "What is machine learning?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help you?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": "Machine learning is a subset of artificial intelligence...",
  "metadata": {
    "contextUsed": true,
    "chunksRetrieved": 3,
    "responseTime": "1245ms",
    "apiVersion": "1.0"
  }
}
```

**Parameters:**
- `message` (string, required): User's message
- `conversationHistory` (array, optional): Previous conversation messages

---

## 🔒 Security Features

### 1. **API Key Hashing**
- API keys are hashed using SHA-256 before storage
- Only the hash is stored in the database
- Keys are never stored in plain text

### 2. **Rate Limiting**
- Default: 1000 requests per hour per API key
- Configurable per key
- Headers include rate limit information:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: When the limit resets

### 3. **Endpoint Access Control**
- Each API key can be restricted to specific endpoints
- Configure during key generation

### 4. **Key Expiration**
- Optional expiration dates for API keys
- Expired keys are automatically rejected

### 5. **Encrypted Communication**
- All requests should use HTTPS in production
- Supports AES-256 encryption for sensitive data

---

## 📊 Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid Authorization header",
  "details": "Use: Authorization: Bearer YOUR_API_KEY"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "This API key does not have access to the 'chat' endpoint",
  "allowedEndpoints": ["complete-word", "suggest-phrase"]
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "rateLimit": {
    "limit": 1000,
    "remaining": 0,
    "resetAt": "2026-01-30T13:00:00Z"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## 🛠️ Code Examples

### JavaScript/TypeScript
```javascript
const API_KEY = 'tk_live_YOUR_API_KEY';
const BASE_URL = 'https://your-domain.com';

async function completeWord(text, incompleteWord) {
  const response = await fetch(`${BASE_URL}/api/public/complete-word`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, incompleteWord, limit: 5 })
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.suggestions;
}

// Usage
const suggestions = await completeWord('I love to eat', 'app');
console.log(suggestions);
```

### Python
```python
import requests

API_KEY = 'tk_live_YOUR_API_KEY'
BASE_URL = 'https://your-domain.com'

def complete_word(text, incomplete_word):
    response = requests.post(
        f'{BASE_URL}/api/public/complete-word',
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'text': text,
            'incompleteWord': incomplete_word,
            'limit': 5
        }
    )
    response.raise_for_status()
    return response.json()['suggestions']

# Usage
suggestions = complete_word('I love to eat', 'app')
print(suggestions)
```

### cURL
```bash
curl -X POST https://your-domain.com/api/public/complete-word \
  -H "Authorization: Bearer tk_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I love to eat",
    "incompleteWord": "app",
    "limit": 5
  }'
```

---

## 🔧 Managing API Keys

### List All Keys
**Endpoint:** `GET /api/keys/generate`

Returns all API keys (without the actual key values).

### Update a Key
**Endpoint:** `PATCH /api/keys/{id}`

```json
{
  "isActive": false,
  "rateLimit": 500,
  "name": "Updated Name"
}
```

### Delete a Key
**Endpoint:** `DELETE /api/keys/{id}`

Permanently deletes an API key and all associated usage logs.

---

## 📈 Best Practices

1. **Keep Keys Secret**: Never expose API keys in client-side code or public repositories
2. **Use Environment Variables**: Store keys in environment variables, not in code
3. **Rotate Keys Regularly**: Generate new keys periodically for security
4. **Monitor Usage**: Check API usage logs to detect unusual activity
5. **Set Appropriate Rate Limits**: Configure limits based on your expected usage
6. **Use Expiration Dates**: Set expiration dates for temporary access
7. **Restrict Endpoints**: Only allow access to endpoints you need

---

## 🆘 Support

For issues or questions:
- GitHub: [github.com/DaraBoth/fine-tune-AI-suggestion](https://github.com/DaraBoth/fine-tune-AI-suggestion)
- Email: support@your-domain.com

---

## 📝 Rate Limits

| Plan | Requests/Hour | Endpoints |
|------|---------------|-----------|
| Free | 100 | All |
| Basic | 1,000 | All |
| Pro | 10,000 | All |
| Enterprise | Custom | All |

---

## 🔄 API Versioning

Current Version: **1.0**

The API version is included in response headers:
```
X-API-Version: 1.0
```

---

## 📜 License

This API is provided under the MIT License. See LICENSE file for details.
