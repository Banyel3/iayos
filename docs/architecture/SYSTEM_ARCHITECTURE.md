# iAyos Marketplace Platform - System Architecture

## Overview
iAyos is a comprehensive marketplace platform for blue-collar services connecting clients with skilled workers. The platform facilitates job posting, worker applications, secure payments, and communication between parties.

## Technology Stack

### Backend (Django/Python)
- **Framework**: Django 5.2.8 with Django Ninja for API
- **Database**: PostgreSQL
- **Authentication**: Django Allauth + JWT
- **Real-time Communication**: Django Channels with WebSockets
- **Payment Processing**: Xendit integration
- **Storage**: Supabase for file storage
- **Production Server**: Gunicorn with Daphne for WebSockets

### Frontend Web (Next.js/React)
- **Framework**: Next.js 15.5.3 with React 19.1.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database ORM**: Prisma with PostgreSQL
- **State Management**: TanStack Query (React Query)
- **Authentication**: NextAuth.js
- **UI Components**: Radix UI primitives
- **Email**: Resend for transactional emails

### Mobile App (Flutter)
- **Framework**: Flutter (Dart)
- **Platforms**: iOS, Android, Web, Windows, macOS, Linux
- **Architecture**: Standard Flutter project structure

### Infrastructure & DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Monorepo**: Turborepo for build orchestration
- **Development**: Hot reload for both frontend and backend
- **Security**: Non-root containers, Alpine Linux base images

## Database Architecture

### Core Models (Django Backend)

#### User Management
- **Accounts**: Main user authentication model (extends AbstractBaseUser)
  - Email-based authentication
  - KYC verification status
  - Location fields (address, city, province, postal code)
  - Timestamps and verification tokens

- **Profile**: User profile information
  - Personal details (name, contact, birth date, profile image)
  - Profile type (WORKER/CLIENT)
  - GPS location tracking for worker availability
  - Location sharing preferences

- **Agency**: Business entity profiles
  - Business details and description
  - Address information
  - Associated with main account

#### Worker System
- **WorkerProfile**: Extended profile for service providers
  - Availability status (AVAILABLE/BUSY/OFFLINE)
  - Earnings tracking
  - Rating system
  - Bio and description

- **Specializations**: Service categories
  - Service name and description
  - Rate information (minimum rates, rate types)
  - Average project cost ranges

- **workerSpecialization**: Many-to-many relationship
  - Worker expertise in specific services
  - Experience years and certifications

#### Job Management
- **Job**: Core job posting model
  - Job details (title, description, budget, location)
  - Status tracking (ACTIVE/IN_PROGRESS/COMPLETED/CANCELLED)
  - Escrow payment system (50% downpayment + 50% completion)
  - Payment method tracking (GCash/Cash)
  - Two-phase completion (worker + client confirmation)
  - Materials needed (JSON field)
  - Urgency levels and duration estimates

- **JobApplication**: Worker applications to jobs
  - Proposal message and budget negotiation
  - Status tracking (PENDING/ACCEPTED/REJECTED/WITHDRAWN)
  - Unique constraint per job-worker pair

- **JobPhoto**: Job attachments and images
- **JobLog**: Audit trail for job status changes

#### Quality & Trust
- **JobReview**: Bidirectional review system
  - Client-to-worker and worker-to-client reviews
  - 1-5 star ratings with comments
  - Moderation features (flagging, hiding)
  - Helpful vote counting

- **JobDispute**: Conflict resolution system
  - Dispute tracking and priority levels
  - Amount disputes and resolution tracking
  - Admin assignment and resolution

#### KYC & Verification
- **kyc**: Know Your Customer verification
  - Status tracking (PENDING/APPROVED/REJECTED)
  - Admin review workflow
  - Review notes and timestamps

- **kycFiles**: Document uploads
  - Multiple ID types (Passport, National ID, Driver's License, etc.)
  - File metadata and validation
  - Supabase storage integration

#### Financial System
- **Wallet**: User balance management
  - Account-linked wallet system
  - Balance tracking and updates

- **Transaction**: Complete transaction history
  - Multiple transaction types (DEPOSIT/WITHDRAWAL/PAYMENT/REFUND/EARNING/FEE)
  - Xendit payment integration
  - Status tracking and payment method recording
  - Job-linked transactions

#### Communication
- **Conversation**: Chat conversations (Profiles app)
- **Message**: Individual chat messages
- **MessageAttachment**: File attachments in chats
- **Notification**: System notifications for users

#### Administration
- **KYCLogs**: KYC review audit trail (Admin panel)
- **SystemRoles**: Admin role management

## API Structure

### Django API Endpoints (Django Ninja)
- `/api/accounts/` - User management, authentication, profiles
- `/api/adminpanel/` - Administrative functions, KYC management
- `/api/profiles/` - Profile management, messaging, worker products
- `/api/agency/` - Agency-specific operations
- `/api/jobs/` - Job management, applications, reviews

### Frontend API Integration
- Custom hooks for data fetching (useJobQueries, useInboxQueries)
- TanStack Query for caching and state management
- Consistent error handling and loading states

## Key Features

### For Workers
- Profile creation with skill specialization
- Job browsing and application system
- Real-time availability status
- Location-based job matching
- Earnings tracking and wallet management
- Client communication through chat
- Review and rating system

### For Clients
- Job posting with detailed requirements
- Worker discovery and selection
- Secure escrow payment system
- Project management and communication
- Review and rating system
- Dispute resolution

### For Agencies
- Business profile management
- Employee management system
- Bulk job posting capabilities
- KYC verification for business entities

### For Administrators
- KYC verification workflow
- User management and moderation
- Dispute resolution tools
- System monitoring and analytics
- Payment and transaction oversight

## Security Features

### Backend Security
- Django security framework with latest patches
- JWT-based authentication
- CORS headers configuration
- Input validation and sanitization
- SQL injection prevention through ORM
- XSS protection
- CSRF protection

### Container Security
- Non-root user execution
- Alpine Linux base images
- Minimal attack surface
- Security scanning with SARIF reports
- Health checks for services

### Data Protection
- Password hashing (Django's built-in)
- Email verification workflow
- KYC document verification
- Secure file storage (Supabase)
- Payment security (Xendit PCI compliance)

## Payment System

### Escrow System
1. **Job Creation**: Client posts job with budget
2. **Worker Selection**: Client accepts application
3. **Downpayment**: 50% held in escrow via Xendit
4. **Work Progress**: Real-time updates and communication
5. **Completion**: Two-phase completion (worker + client confirmation)
6. **Final Payment**: Remaining 50% via chosen method (GCash/Cash)
7. **Cash Verification**: Admin approval for cash payments

### Integration
- **Xendit**: Primary payment processor
- **GCash**: Digital wallet integration
- **Cash Payments**: With proof upload and admin verification
- **Transaction Tracking**: Complete audit trail

## Development Environment

### Local Development
```bash
# Backend development
docker-compose -f docker-compose.dev.yml up

# Frontend development
cd apps/frontend_web && npm run dev

# Full stack development
npm run dev # (from root)
```

### Production Deployment
```bash
# Production build
docker-compose up

# With nginx reverse proxy
# Includes SSL termination and static file serving
```

## File Structure
```
iayos/
├── apps/
│   ├── backend/          # Django API server
│   │   ├── src/
│   │   │   ├── accounts/       # User management
│   │   │   ├── adminpanel/     # Admin functions
│   │   │   ├── agency/         # Agency management
│   │   │   ├── jobs/           # Job system
│   │   │   ├── profiles/       # Profiles & messaging
│   │   │   └── iayos_project/  # Django settings
│   │   └── requirements.txt
│   ├── frontend_web/     # Next.js web application
│   │   ├── app/               # App router structure
│   │   ├── components/        # Reusable components
│   │   ├── lib/              # Utilities and configurations
│   │   ├── prisma/           # Database schema
│   │   └── types/            # TypeScript definitions
│   └── frontend_mobile/  # Flutter mobile app
├── packages/             # Shared packages (if any)
├── docker-compose.yml    # Production docker setup
├── docker-compose.dev.yml # Development docker setup
├── Dockerfile           # Multi-stage build configuration
└── turbo.json          # Turborepo configuration
```

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `DJANGO_SECRET_KEY`: Django security key
- `XENDIT_API_KEY`: Payment processor API key
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend
- `SUPABASE_*`: File storage configuration

### Development vs Production
- Development uses hot reload and debug modes
- Production uses optimized builds and security headers
- Database can be local (dev) or remote (production)

## Monitoring & Observability

### Health Checks
- Backend API health endpoint
- Frontend health monitoring
- Database connection verification
- Payment processor connectivity

### Logging
- Django logging framework
- Transaction audit trails
- Job status change logs
- KYC review logs

## Future Considerations

### Scalability
- Microservices migration path
- Database sharding strategies
- CDN integration for static assets
- Caching layer implementation

### Features
- Advanced search and filtering
- Machine learning for job matching
- Mobile app feature parity
- Advanced analytics dashboard
- Multi-language support

### Integration
- Additional payment processors
- Third-party verification services
- Social media authentication
- Calendar integration for scheduling

---

**Last Updated**: January 2025
**Version**: 1.0
**Maintainer**: Development Team