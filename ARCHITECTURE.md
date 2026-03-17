# Architecture Documentation

> Детальное описание архитектуры системы для разработчиков и ИИ агентов

---

## 1. System Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Browser    │  │   Mobile App │  │  Third-party │           │
│  │   (React)    │  │  (React Native)│  │  API Client  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  API GATEWAY / LOAD BALANCER                      │
│              (Nginx / AWS ALB / Vercel)                           │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌──────────┐         ┌──────────┐         ┌──────────┐
   │  API     │         │  API     │         │  API     │
   │ Server 1 │         │ Server 2 │         │ Server 3 │
   └──────────┘         └──────────┘         └──────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
         ┌──────────┐  ┌──────────┐  ┌──────────┐
         │ Service  │  │ Service  │  │ Service  │
         │   1      │  │   2      │  │   3      │
         └──────────┘  └──────────┘  └──────────┘
                │             │             │
                └─────────────┼─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌────────┐           ┌──────────┐          ┌────────┐
   │ Cache  │           │ Primary  │          │Message │
   │(Redis) │           │ Database │          │ Queue  │
   └────────┘           └──────────┘          └────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Replicas │
                        │(Read DB) │
                        └──────────┘
```

---

## 2. Architectural Patterns

### 2.1 Layered Architecture (N-Tier)

```
┌────────────────────────────────────────────┐
│          PRESENTATION LAYER                │
│  Controllers, Input Validation, DTOs       │
└────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│          SERVICE LAYER                     │
│  Business Logic, Orchestration             │
└────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│          REPOSITORY LAYER                  │
│  Data Access, Queries, Transactions        │
└────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│          DATA LAYER                        │
│  Database, Cache, File Storage             │
└────────────────────────────────────────────┘
```

### 2.2 Dependency Injection

```javascript
// Example: Service receives dependencies
class UserService {
  constructor(userRepository, emailService, logger) {
    this.userRepository = userRepository;
    this.emailService = emailService;
    this.logger = logger;
  }

  async createUser(userData) {
    // Use injected dependencies
    const user = await this.userRepository.create(userData);
    await this.emailService.sendWelcome(user.email);
    this.logger.info('User created', { userId: user.id });
  }
}

// Usage with container
const container = new DIContainer();
container.register('userRepository', UserRepository);
container.register('emailService', EmailService);
container.register('logger', Logger);
container.register('userService', UserService);

const userService = container.get('userService');
```

### 2.3 Repository Pattern

```javascript
// Abstract data access logic
class UserRepository {
  async findById(id) {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  }

  async findByEmail(email) {
    return db.query('SELECT * FROM users WHERE email = $1', [email]);
  }

  async create(userData) {
    return db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [userData.name, userData.email, userData.password]
    );
  }

  async update(id, userData) {
    return db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [userData.name, userData.email, id]
    );
  }

  async delete(id) {
    return db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}
```

### 2.4 Service-Oriented Architecture

```
User Request
     │
     ▼
┌─────────────────┐
│  API Controller │  ← Handle HTTP, validate input
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  User Service           │  ← Business logic
│ - createUser()          │
│ - validateEmail()       │
│ - hashPassword()        │
│ - sendWelcomeEmail()    │
└────────┬────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
    ┌─────────┐          ┌──────────────┐
    │ User    │          │ Email        │
    │Repository│          │ Service      │
    └─────────┘          └──────────────┘
         │                     │
         ▼                     ▼
    ┌──────────┐          ┌──────────┐
    │ Database │          │ SMTP API │
    └──────────┘          └──────────┘
```

---

## 3. Component Breakdown

### 3.1 API Layer

**Location**: `src/api/`

```
src/api/
├── router.js              # Main route definitions
├── middleware/
│   ├── auth.js           # JWT verification
│   ├── errorHandler.js   # Error handling
│   ├── validation.js     # Input validation
│   ├── cors.js          # CORS configuration
│   └── logger.js        # Request logging
└── endpoints/
    ├── auth.js          # Auth routes
    ├── users.js         # User routes
    ├── posts.js         # Post routes
    └── admin.js         # Admin routes
```

**Responsibilities**:
- Handle HTTP requests/responses
- Input validation
- Authentication/Authorization
- Error handling
- Request logging

### 3.2 Service Layer

**Location**: `src/services/`

```
src/services/
├── AuthService.js         # Authentication logic
├── UserService.js         # User management
├── PostService.js         # Post operations
├── EmailService.js        # Email sending
├── CacheService.js        # Caching logic
└── ExternalAPIService.js  # Third-party API calls
```

**Responsibilities**:
- Business logic
- Data validation
- Orchestration between repositories
- External service calls
- Caching logic

### 3.3 Repository Layer

**Location**: `src/repositories/`

```
src/repositories/
├── UserRepository.js      # User data access
├── PostRepository.js      # Post data access
├── CommentRepository.js   # Comment data access
└── BaseRepository.js      # Common CRUD operations
```

**Responsibilities**:
- Database queries
- Transactions
- Data transformation
- Query optimization

### 3.4 Models

**Location**: `src/models/`

```
src/models/
├── User.js               # User schema
├── Post.js               # Post schema
├── Comment.js            # Comment schema
└── Transaction.js        # Transaction schema
```

**Responsibilities**:
- Data structure definition
- Validation schemas
- Type definitions (if TypeScript)

### 3.5 Utils & Helpers

**Location**: `src/utils/`

```
src/utils/
├── validators/
│   ├── email.js
│   ├── password.js
│   └── phone.js
├── formatters/
│   ├── date.js
│   ├── currency.js
│   └── text.js
├── crypto.js            # Encryption/hashing
├── jwt.js              # JWT utilities
└── constants.js        # App constants
```

---

## 4. Data Flow

### 4.1 Create User Request Flow

```
Client Request
│
├─ POST /api/users/register
├─ { email, password, name }
│
▼
┌──────────────────┐
│ Auth Middleware  │ ← Check CORS, parse JSON
└──────────────────┘
│
▼
┌──────────────────────┐
│ Validation           │ ← Validate input format
│ Middleware           │
└──────────────────────┘
│
▼
┌──────────────────┐
│ RegisterController│ ← Handle request
└──────────────────┘
│
▼
┌──────────────────┐
│ UserService      │ ← Business logic
│ .register()      │
└──────────────────┘
│
├─ Check if user exists
│  └─ userRepository.findByEmail()
│     └─ Database Query
│
├─ Hash password
│  └─ bcrypt.hash()
│
├─ Create user
│  └─ userRepository.create()
│     └─ Database Insert
│
├─ Send welcome email
│  └─ emailService.sendWelcome()
│     └─ SMTP API call
│
└─ Generate JWT
   └─ jwtUtils.sign()

▼
┌──────────────────┐
│ Response         │ ← Send response
│ { user, token } │
└──────────────────┘
│
▼
Client receives response
```

### 4.2 Database Transaction Example

```javascript
// In UserService
async createUserWithProfile(userData, profileData) {
  // All or nothing - either both succeed or both fail
  return await db.transaction(async (trx) => {
    // Create user
    const user = await this.userRepository
      .transacting(trx)
      .create(userData);

    // Create profile (in same transaction)
    const profile = await this.profileRepository
      .transacting(trx)
      .create({
        ...profileData,
        userId: user.id
      });

    return { user, profile };
  });
  // If any error occurs, entire transaction is rolled back
}
```

---

## 5. Database Schema

### 5.1 Core Tables

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Posts table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 5.2 Indexing Strategy

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Full-text search indexes
CREATE INDEX idx_posts_content ON posts USING GIN(to_tsvector('english', content));
```

---

## 6. Caching Strategy

### 6.1 Cache Layers

```
┌─────────────────────────────────┐
│ Browser Cache (Service Worker)  │  ← TTL: 30 days
├─────────────────────────────────┤
│ CDN Cache (Cloudflare/CloudFront)│  ← TTL: 1-7 days
├─────────────────────────────────┤
│ HTTP Cache (ETag, Cache-Control)│  ← TTL: 1 hour
├─────────────────────────────────┤
│ Application Cache (Redis)       │  ← TTL: 1-24 hours
├─────────────────────────────────┤
│ Database Query Cache            │  ← TTL: 5-60 minutes
└─────────────────────────────────┘
```

### 6.2 Cache Implementation

```javascript
// Cache pattern: Cache-Aside (Lazy Loading)
async function getUser(userId) {
  const cacheKey = `user:${userId}`;

  // Check cache first
  let user = await cache.get(cacheKey);

  if (!user) {
    // Cache miss - fetch from database
    user = await userRepository.findById(userId);

    // Store in cache
    if (user) {
      await cache.set(cacheKey, user, 3600); // 1 hour TTL
    }
  }

  return user;
}

// Cache invalidation on update
async function updateUser(userId, userData) {
  const cacheKey = `user:${userId}`;

  // Update database
  const user = await userRepository.update(userId, userData);

  // Invalidate cache
  await cache.delete(cacheKey);

  return user;
}
```

---

## 7. Authentication & Authorization

### 7.1 JWT Flow

```
Login Request
│
├─ Validate credentials
│
├─ Create JWT token
│  ├─ Header: { alg: 'HS256', typ: 'JWT' }
│  ├─ Payload: { userId, email, role, exp: +24h }
│  └─ Signature: HMAC(header + payload, secret)
│
├─ Return token to client
│
└─ Client stores token (localStorage/sessionStorage)

Protected Resource Request
│
├─ Client sends: Authorization: Bearer <token>
│
├─ Server verifies signature
│
├─ Check token expiration
│
├─ Extract userId from payload
│
└─ Grant/deny access based on role
```

### 7.2 Authorization Levels

```javascript
// Middleware-based role checking
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Usage
router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUser);
```

---

## 8. Error Handling

### 8.1 Error Hierarchy

```
BaseError
├─ ValidationError
│  ├─ EmailValidationError
│  └─ PasswordValidationError
├─ AuthenticationError
│  ├─ InvalidCredentialsError
│  └─ TokenExpiredError
├─ AuthorizationError
│  └─ InsufficientPermissionsError
├─ NotFoundError
│  ├─ UserNotFoundError
│  └─ PostNotFoundError
└─ ServerError
   ├─ DatabaseError
   └─ ExternalServiceError
```

### 8.2 Global Error Handler

```javascript
// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Error occurred', { error, path: req.path });

  // Custom error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const details = process.env.NODE_ENV === 'development' ? error : undefined;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: error.code,
      details
    }
  });
});
```

---

## 9. Scalability Considerations

### 9.1 Horizontal Scaling

```
Load Balancer
├─ API Server 1 (Process)
├─ API Server 2 (Process)
├─ API Server 3 (Process)
└─ API Server 4 (Process)

Shared Resources:
├─ PostgreSQL (with replicas)
├─ Redis cluster
└─ Message Queue (RabbitMQ)
```

### 9.2 Database Optimization for Scale

```javascript
// Connection pooling
const pool = new Pool({
  max: 20,                    // Max connections
  min: 5,                     // Min connections
  idleTimeoutMillis: 30000,   // Idle timeout
  connectionTimeoutMillis: 2000
});

// Query optimization
// Use SELECT only needed columns
SELECT id, email, name FROM users;  // ✅ Good
SELECT * FROM users;                 // ❌ Avoid

// Use indexes for WHERE, JOIN, ORDER BY
CREATE INDEX idx_users_email ON users(email);

// Pagination instead of loading all
SELECT * FROM posts LIMIT 20 OFFSET 0;
```

### 9.3 Message Queue for Async Operations

```javascript
// For heavy operations, use message queue
async function createUser(userData) {
  // Create user synchronously
  const user = await userRepository.create(userData);

  // Send email asynchronously
  await messageQueue.publish('email.welcome', {
    userId: user.id,
    email: user.email
  });

  return user;
}

// Worker process
messageQueue.subscribe('email.welcome', async (message) => {
  await emailService.sendWelcome(message.email);
});
```

---

## 10. Monitoring & Observability

### 10.1 Logging Strategy

```javascript
// Structured logging
logger.info('User created', {
  userId: user.id,
  email: user.email,
  timestamp: new Date(),
  duration: Date.now() - startTime
});

logger.error('Database connection failed', {
  error: err.message,
  code: err.code,
  retryCount: 3
});

// Log levels: debug, info, warn, error, fatal
```

### 10.2 Metrics to Track

```
Performance:
- Response time (p50, p95, p99)
- Requests per second
- Error rate %
- Database query time
- Cache hit ratio

Business:
- Active users
- Conversion rate
- User retention
- Feature usage

Infrastructure:
- CPU usage
- Memory usage
- Disk usage
- Network I/O
- Database connections
```

---

## 11. Security Principles

### 11.1 Defense in Depth

```
Layer 1: Network → SSL/TLS, WAF, DDoS protection
Layer 2: API → CORS, Rate limiting, Input validation
Layer 3: Auth → JWT, RBAC, 2FA
Layer 4: Data → Encryption, Access control
Layer 5: Audit → Logging, Monitoring
```

### 11.2 Input Validation

```javascript
// Always validate input
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().max(255).required()
});

const { error, value } = schema.validate(userData);
if (error) {
  throw new ValidationError(error.message);
}
```

---

## Summary

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalability from startup to millions of users
- ✅ Maintainability through consistent patterns
- ✅ Testability through dependency injection
- ✅ Security through layered defense
- ✅ Performance through caching and optimization
