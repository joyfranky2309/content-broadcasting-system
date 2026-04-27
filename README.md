# Content Broadcasting System

A dynamic content broadcasting platform that enables teachers to upload educational content, principals to approve submissions, and students to access live rotating content streams. The system uses intelligent round-robin scheduling with Redis caching and rate limiting to efficiently serve content to large student populations.

## Features

- **User Authentication**: JWT-based authentication with role-based access control (RBAC)
- **Content Management**: Teachers upload and submit content for principal approval
- **Approval Workflow**: Principals review and approve/reject content with feedback
- **Live Broadcasting**: Public API streams currently-active content based on rotation schedules
- **Smart Scheduling**: Round-robin content rotation with configurable duration weights
- **Redis Caching**: 60-second TTL cache reduces database load and improves response times
- **Rate Limiting**: 100 requests per 15 minutes per IP on public endpoints protects against abuse
- **File Upload**: Secure file handling with type validation (jpg, png, gif) and 10MB size limit

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis (v4+)
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Rate Limiting**: express-rate-limit

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── authController.js
│   ├── uploadController.js
│   ├── approvalController.js
│   └── broadcastController.js
├── routes/              # Express route definitions
│   ├── authRoutes.js
│   ├── contentRoutes.js
│   ├── approvalRoutes.js
│   └── broadcastRoutes.js
├── middlewares/         # Express middlewares
│   ├── authMiddleware.js
│   └── uploadMiddleware.js
├── services/            # Business logic
│   └── schedulingService.js
├── utils/               # Utilities
│   ├── db.js
│   └── redisClient.js
├── models/              # Database schema
│   └── schema.sql
├── index.js             # Main app file
└── architecture-notes.txt
uploads/                 # File storage directory
.gitignore
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- Redis (v4+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/joyfranky2309/content-broadcasting-system.git
   cd content-broadcasting-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables:
   ```
   PORT=5000
   DATABASE_URL=postgresql://user:password@localhost:5432/content_db
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=development
   ```

4. **Initialize database**
   ```bash
   psql -U postgres -d content_db -f src/models/schema.sql
   ```

5. **Start Redis**
   ```bash
   redis-server
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   
   Server runs on `http://localhost:5000`

## API Endpoints

### Authentication (Public)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Content Management (Teacher Only)
- `POST /api/content/upload` - Upload content with metadata
- `POST /api/content/:contentId/submit` - Submit uploaded content for principal review

### Approval Workflow (Principal Only)
- `GET /api/approvals/pending` - View all pending content awaiting approval
- `PUT /api/approvals/:contentId/approve` - Approve content for broadcasting
- `PUT /api/approvals/:contentId/reject` - Reject content with feedback

### Public Broadcasting (Rate Limited)
- `GET /api/content/live/:teacherId` - Get currently active content for a teacher (100 req/15 min per IP)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Roles

- **Teacher**: Can upload content and submit for review
- **Principal**: Can view pending content and approve/reject submissions
- **Student**: Can access public broadcast API without authentication

## Database Schema

### users
Stores user credentials and roles.
```sql
id, name, email, password_hash, role (principal/teacher), created_at
```

### content
Central content repository tracking the approval workflow.
```sql
id, title, description, subject, file_url, file_type, file_size, 
uploaded_by (FK), status (uploaded/pending/approved/rejected), 
rejection_reason, approved_by (FK), approved_at, start_time, end_time, created_at
```

### content_slots
One slot per subject to prevent conflicts.
```sql
id, subject (UNIQUE), created_at
```

### content_schedule
Maps content to slots with rotation parameters.
```sql
id, content_id (FK), slot_id (FK), rotation_order, duration, created_at
```

## Scheduling Algorithm

The system uses intelligent round-robin scheduling to determine which content is "live" at any moment.

**How it works:**
1. Query all approved content for the teacher within their time window
2. Sum all duration values to get total cycle time
3. Calculate elapsed time since the earliest approval timestamp
4. Apply modulo: `position = elapsed_time % total_cycle_time`
5. Find which content item's duration range contains the position

**Example:**
- Content A: 5 minutes, Content B: 3 minutes → 8-minute total cycle
- If 13 minutes have elapsed: position = 13 % 8 = 5 minutes
- Position 5 falls in Content B's range (5-7), so Content B is returned

Results are cached in Redis for 60 seconds to reduce database queries.

## Rate Limiting

The public broadcast endpoint is protected with rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Purpose**: Prevents DDoS attacks, bot abuse, and excessive bandwidth usage
- **Response**: Returns 429 Too Many Requests when limit exceeded

## File Upload

Files are uploaded via multipart/form-data with the following restrictions:
- **Allowed types**: jpg, png, gif
- **Max size**: 10MB
- **Storage**: Local `/uploads` directory (switch to S3 for production)

## Environment Variables

```
PORT                  # Server port (default: 5000)
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET            # Secret key for JWT signing
NODE_ENV              # Environment (development/production)
REDIS_URL             # Redis connection URL (optional, defaults to localhost:6379)
```

## Scalability Features

- **Redis Caching**: 60-second cache dramatically reduces database queries
- **Connection Pooling**: Efficient PostgreSQL connection management
- **Stateless Controllers**: Easy horizontal scaling
- **Rate Limiting**: Protects against abuse spikes
- **JWT Auth**: No server-side session storage needed

## Current Architecture Limitations

- Single server (no load balancer)
- Local file storage (no multi-server support)
- Database not replicated (single instance)
- Redis not replicated (single instance)

## Future Improvements

- Add AWS S3 for distributed file storage
- Implement read replicas for high-traffic databases
- Add Redis Sentinel for high availability
- Deploy behind a load balancer for horizontal scaling
- Add WebSocket support for real-time content updates
- Implement content analytics and viewing statistics
- Add support for video content with streaming

## Development

### Running Tests
```bash
npm test
```

### Code Style
The project follows Express.js conventions and REST API best practices.

### Contributing
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Troubleshooting

### "Connection refused" errors
- Ensure PostgreSQL is running: `psql --version`
- Ensure Redis is running: `redis-cli ping`
- Check DATABASE_URL and connection parameters

### "No content available"
- Verify content status is 'approved' (not 'pending')
- Check that current time is within content's start_time and end_time
- Verify Redis cache hasn't stored stale data

### File upload failures
- Check file type (jpg, png, gif only)
- Verify file size is under 10MB
- Ensure /uploads directory has write permissions

## License

MIT

## Contact

For questions or issues, please open a GitHub issue.
