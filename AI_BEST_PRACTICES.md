# Best Practices for Working with AI Agents

> Проверенные способы максимизировать производительность при работе с ИИ агентами типа Claude Code

---

## 🎯 Основной принцип

**Ясность информации = Качество результата**

ИИ агент работает лучше всего, когда имеет:
- ✅ Четкие требования
- ✅ Доступ к правильной документации
- ✅ Понимание архитектуры системы
- ✅ Примеры существующего кода

---

## 📋 Структурированная информация

### 1. PRD как единый источник истины

**ДО (Плохо)**:
```
"Добавь функцию авторизации через Google"
```

**ПОСЛЕ (Хорошо)**:
```
"Добавь Google OAuth (реквизиты в PRD.md, Section 5.3).

Требования:
- Redirect URL: /auth/google/callback
- Использовать passport.js
- Сохранять socialId в users table
- JWT token в ответе

Примеры существующего кода:
- GitHub OAuth: src/services/AuthService.js (line 45-60)
- Passport setup: src/config/passport.js

Где добавить:
- Service: src/services/AuthService.js
- Endpoint: src/api/endpoints/auth.js (добавить новый маршрут)
- Config: src/config/strategies/google.js (новый файл)
- Tests: tests/unit/services/auth.google.test.js (новый файл)"
```

### 2. Документируйте архитектурные решения

```markdown
# Архитектурное решение: Microservices vs Monolith

## Выбор: Monolith с модульной архитектурой

### Почему?
- Простота deployment на начальном этапе
- Легче debugить и тестировать
- Меньше операционных сложностей

### Когда мигрировать на микросервисы?
- Когда один сервис обрабатывает >10k req/sec
- Когда разные команды работают над разными компонентами
- Когда нужны разные tech stacks для разных частей

### Текущая модульная структура
- Auth Module: src/auth/
- User Module: src/users/
- Post Module: src/posts/
- Comment Module: src/comments/

Каждый модуль может быть извлечен в отдельный микросервис
```

### 3. Визуализируйте сложные структуры

```markdown
# Data Model: Post with Comments

## Текущая структура
```
Post
├─ title
├─ content
├─ author_id → User
├─ Comments[]
│  └─ Comment
│     ├─ content
│     ├─ author_id → User
│     └─ created_at
└─ created_at
```

## Как это хранится в БД
```
posts table
├─ id (PK)
├─ user_id (FK → users)
├─ title
├─ content
└─ created_at

comments table
├─ id (PK)
├─ post_id (FK → posts)
├─ user_id (FK → users)
├─ content
└─ created_at
```

## Как это возвращается в API
```json
{
  "post": {
    "id": 1,
    "title": "...",
    "author": { "id": 1, "name": "..." },
    "comments": [
      { "id": 1, "content": "...", "author": {...} }
    ]
  }
}
```
```

---

## 💬 Эффективные промпты

### Шаблон 1: Новая фича

```markdown
## Task: Implement [Feature Name]

### User Story
**As a** [user type]
**I want** [action]
**So that** [benefit]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Updated docs/api.md

### Technical Context

#### Architecture
- Location: [Path where to add code]
- Dependencies: [What this depends on]
- Constraints: [What can't be changed]

#### Example code (if applicable)
[Show similar existing code]

#### Database changes (if needed)
[Show SQL or migration]

### API Specification (if REST endpoint)
```
POST /api/[endpoint]
Authorization: Bearer {token}

Request:
{
  "field1": "type",
  "field2": "type"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 123,
    "field1": "value"
  }
}

Error responses:
- 400: [validation error description]
- 401: [auth error description]
- 500: [server error description]
```

### Testing
- Unit test file: tests/unit/services/[Feature].test.js
- Integration test file: tests/integration/api/[endpoint].test.js
- Mock data: tests/fixtures/[feature].json

### Definition of Done
- [ ] Code written
- [ ] Tests passing
- [ ] Linting passes
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No console errors
```

### Шаблон 2: Bug fix

```markdown
## Task: Fix [Bug Name]

### Bug Description
[Detailed description of the bug]

### How to Reproduce
1. Step 1
2. Step 2
3. Bug occurs at: [location in code]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Root Cause Analysis (if known)
[File: src/..., Line: X]
[Code snippet]
[Why it's wrong]

### Solution
[High-level description]

### Testing
```
// Test to verify fix
Test case: [Test name]
Input: [Input data]
Expected: [Expected output]
```

### Files to Modify
- [ ] src/...
- [ ] tests/...
- [ ] docs/...
```

### Шаблон 3: Refactoring

```markdown
## Task: Refactor [Component/Service Name]

### Current State
[Current implementation issues]

### Goals
- [ ] Goal 1 (e.g., improve readability)
- [ ] Goal 2 (e.g., reduce complexity)
- [ ] Goal 3 (e.g., improve performance)

### Constraints
- [ ] Must maintain all existing functionality
- [ ] Must not change public API
- [ ] All tests must pass

### Implementation Plan
1. Step 1
2. Step 2
3. Step 3

### Metrics
- Before: Cyclomatic Complexity: X
- After: Cyclomatic Complexity: X

### Testing
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing completed
```

---

## 🔄 Code Review for AI Agents

### Промпт для code review

```markdown
## Code Review Request

### Code to Review
[Paste the code]

### Context
[What does this code do?]

### Acceptance Criteria
[What should this code do?]

### Specific Areas to Review
- [ ] Performance implications
- [ ] Security vulnerabilities
- [ ] Error handling edge cases
- [ ] Code readability
- [ ] Test coverage

### Questions
[Any specific concerns?]
```

---

## 📚 Документирование для ИИ

### Что документировать?

#### 1. Why decisions (most important)

```markdown
# Decision Log

## Scaling Strategy: Horizontal vs Vertical

### Decision: Horizontal Scaling with Load Balancer

### Why?
- More cost-effective for our traffic pattern
- Better fault isolation
- Easier to deploy updates (rolling deployment)

### Why not vertical?
- Hit hardware limits
- Harder to achieve 99.9% uptime

### When to revisit?
- When single instance reaches >10k req/sec
- If latency becomes critical issue

### Trade-offs?
- More complex to setup
- Need distributed session management
- More monitoring needed
```

#### 2. Architecture decisions

```markdown
# Architecture: Session Management

## Chosen: JWT (Stateless)

### Pros
✅ Scalable across servers
✅ No server session storage needed
✅ Works well with microservices

### Cons
❌ Token revocation is harder
❌ Token size in requests
❌ Can't force logout until expiry

### Implementation
- Token generation: src/utils/jwt.js
- Verification: src/middleware/auth.js
- Storage: Client localStorage
```

#### 3. Trade-offs

```markdown
# Trade-off: Real-time Updates

## Option 1: Polling
- Pros: Simple, no additional tech
- Cons: Delay, high server load

## Option 2: WebSockets
- Pros: Real-time, efficient
- Cons: Complex, need new infrastructure

## Option 3: Server-Sent Events (SSE)
- Pros: Real-time, simpler than WebSockets
- Cons: One-directional only

## Chosen: SSE (for now)
- Reason: Good balance of simplicity and functionality
- When to upgrade: If 50+ concurrent connections needed
```

---

## 🔗 Context Management

### Правильный контекст для ИИ

```markdown
## Context for AI Agent

### Session History
- Previous sessions: [List of what was done]
- Current status: [What's complete, what's pending]
- Known issues: [Any blockers]

### Project Overview
[Link to PRD.md]

### Architecture
[Link to ARCHITECTURE.md]

### Code Examples
[Links to similar implementations]

### Database Schema
[Link to schema or show relevant tables]

### API Documentation
[Link to api.md or API Postman collection]

### Style Guide
[Link to code style guide or ESLint config]
```

---

## ✅ Quality Checklist for AI Output

### Code Quality
```
- [ ] Follows existing code style
- [ ] No console.log or debugging code
- [ ] Proper error handling
- [ ] No magic numbers (use constants)
- [ ] DRY principle followed
- [ ] SOLID principles respected
```

### Tests
```
- [ ] Unit tests included
- [ ] >80% coverage for new code
- [ ] Tests are isolated (no dependencies)
- [ ] Edge cases covered
- [ ] Error scenarios tested
```

### Documentation
```
- [ ] Function/method documented
- [ ] Complex logic explained
- [ ] Examples provided (if needed)
- [ ] Related files referenced
```

### Security
```
- [ ] Input validation present
- [ ] No SQL injection risk
- [ ] No XSS vulnerability
- [ ] Secrets not in code
- [ ] OWASP principles followed
```

---

## 🚀 Advanced Techniques

### 1. Chain of Thought Prompting

```markdown
## Let me think through this step by step

Step 1: [Understand requirements]
Step 2: [Check existing code]
Step 3: [Identify dependencies]
Step 4: [Plan the solution]
Step 5: [Implement]
Step 6: [Test]

Now implement...
```

### 2. Example-Driven Development

```markdown
## Implement [Feature] following this pattern

### Pattern Example:
[Show working example of similar feature]

### Apply pattern to:
[New requirements]

### Expected result should look like:
[Show expected code structure]
```

### 3. Iterative Refinement

**First prompt:**
```
Implement basic user authentication
```

**Second prompt (after review):**
```
Improve password validation:
- Minimum 8 characters
- Require uppercase letter
- Require number

Note: I already have password hashing in place
```

**Third prompt (after another review):**
```
Add password strength meter:
- Show real-time strength
- Suggest improvements

API endpoint: POST /api/validate-password
```

---

## 🎓 Learning for AI Agents

### Provide Learning Context

```markdown
## Teaching AI About Your Codebase

### Error Handling Pattern
We use custom error classes:

```javascript
// src/errors/ValidationError.js
class ValidationError extends BaseError {
  constructor(message, field) {
    super(message);
    this.field = field;
    this.statusCode = 400;
  }
}

// Usage
throw new ValidationError('Invalid email', 'email');
```

### Apply This Pattern To:
[New feature requiring error handling]

### Expected Result:
```javascript
// Should look similar to above
```
```

---

## 📊 Metrics for Successful AI Collaboration

### Measure Code Quality
```
✅ >80% test coverage
✅ <10 security vulnerabilities
✅ <5 performance warnings
✅ 0 critical bugs
```

### Measure Productivity
```
✅ Feature completion time
✅ Bug fix time
✅ Code review iterations needed
✅ Production incidents caused by new code
```

### Measure Collaboration
```
✅ Clarity of initial requirements
✅ Iterations needed to approve
✅ Re-work rate
```

---

## ⚠️ Common Pitfalls

### ❌ Pitfall 1: Vague Requirements
```
Bad: "Add admin features"
Good: "Add admin dashboard with user management.
       See PRD.md Section 6.2 for details.
       Similar to existing post management."
```

### ❌ Pitfall 2: Missing Context
```
Bad: "Fix the bug in the API"
Good: "Fix 404 error in POST /api/users.
       Issue: userRepository.create() throws error
       on duplicate email.
       File: src/repositories/UserRepository.js:45
       See src/api/endpoints/users.js for endpoint."
```

### ❌ Pitfall 3: Not Specifying Output Format
```
Bad: "Write tests"
Good: "Write unit tests for UserService.
       Use Jest with this structure:
       - describe('UserService')
       - Arrange/Act/Assert pattern
       - Mock userRepository
       - 80%+ coverage"
```

### ❌ Pitfall 4: Inconsistent Standards
```
Bad: "Mixed code style in project"
Good: "All code uses:
       - ESLint config: .eslintrc
       - Prettier format
       - Joi for validation
       - Custom error classes in src/errors/"
```

---

## 📈 Advanced Workflow

### Weekly Sprint with AI

#### Monday (Planning - 2 hours)
```
1. Define features for the week
2. Create detailed user stories
3. Create prompts for each feature
4. Prepare code examples
```

#### Tuesday-Thursday (Development - 6 hours/day)
```
Morning:
- Review AI output from previous day
- Provide feedback
- Plan today's features

Afternoon:
- Test implementation
- Write integration tests
- Update documentation
- Commit to git
```

#### Friday (Review & Refactor - 4 hours)
```
1. Code review of week's work
2. Performance testing
3. Refactor if needed
4. Update docs
5. Plan next week
```

---

## 🎯 Summary

**Keys to successful AI collaboration:**

1. **Be specific** - Not vague requirements
2. **Provide context** - Link to relevant docs
3. **Show examples** - Point to similar code
4. **Define output** - Specify exact format expected
5. **Iterate** - Review and refine
6. **Document** - Keep knowledge base updated
7. **Measure** - Track quality metrics

**Remember**: Better prompts = Better code

---

## 📚 Further Reading

- [Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Claude Documentation](https://docs.anthropic.com/)
- [CLAUDE.md in this project](./CLAUDE.md)
- [Best Practices from OpenAI](https://openai.com/research/practices-for-safely-publishing-language-models)
