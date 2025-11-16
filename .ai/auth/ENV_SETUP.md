# Environment Variables Setup

## Required Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Database Configuration

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1StrongPwd!
DB_DATABASE=CoachFlow_DEV
```

### JWT Configuration

**IMPORTANT:** Generate your own secure secrets using one of these methods:

**Method 1: Node.js (Recommended)**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Method 2: OpenSSL**

```bash
openssl rand -base64 64
```

Then add to `.env`:

```env
# Use DIFFERENT secrets for access and refresh tokens!
JWT_ACCESS_SECRET=<your_generated_secret_here>
JWT_REFRESH_SECRET=<your_different_generated_secret_here>
JWT_ACCESS_EXPIRATION_TIME=30m
JWT_REFRESH_EXPIRATION_TIME=7d
```

### Bcrypt Configuration

```env
BCRYPT_SALT_ROUNDS=12
```

### Application Configuration

```env
PORT=3000
NODE_ENV=development
```

## Example .env file

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=1StrongPwd!
DB_DATABASE=CoachFlow_DEV

# JWT - REPLACE WITH YOUR OWN SECRETS!
JWT_ACCESS_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8
JWT_ACCESS_EXPIRATION_TIME=30m
JWT_REFRESH_EXPIRATION_TIME=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# App
PORT=3000
NODE_ENV=development
```

## Security Notes

1. **NEVER commit `.env` file to git** - it's already in `.gitignore`
2. **Use different secrets for production**
3. **Secrets should be at least 32 characters long**
4. **Use different secrets for ACCESS and REFRESH tokens**
5. **Rotate secrets periodically in production**

## How JWT Works

### 1. User Login

- User sends email + password
- Backend verifies credentials
- Backend creates JWT token signed with `JWT_ACCESS_SECRET`
- Token contains: user ID, email, role
- Token is sent to frontend

### 2. Authenticated Requests

- Frontend sends token in `Authorization: Bearer <token>` header
- Backend verifies token using `JWT_ACCESS_SECRET`
- If valid, request proceeds with user info
- If invalid/expired, returns 401 Unauthorized

### 3. Token Refresh

- Access token expires after 30 minutes (short-lived for security)
- Refresh token lasts 7 days (stored in database, can be revoked)
- Frontend uses refresh token to get new access token
- Refresh token is rotated (old one deleted, new one created)

## Quick Start

1. Generate secrets:

```bash
cd backend
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

2. Create `.env` file and paste the generated secrets

3. Start the application:

```bash
npm run start:dev
```
