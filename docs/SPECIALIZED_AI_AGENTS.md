# 🤖 Specialized AI Agents for iAyos Platform

**Purpose**: Define specialized AI agent roles for efficient parallel development  
**Created**: November 14, 2025  
**Platform**: Claude Code (Multiple Agent Support)

---

## 🎯 Agent Architecture Overview

The iAyos platform benefits from having specialized AI agents, each with deep expertise in specific domains. This allows for:

- **Parallel Development**: Multiple features worked on simultaneously
- **Domain Expertise**: Agents deeply familiar with their specific stack/domain
- **Quality Assurance**: Dedicated QA agents ensuring thorough testing
- **Consistency**: Each agent follows established patterns in their domain
- **Efficiency**: Reduced context switching, faster iterations

---

## 👷 1. Mobile Feature Developer Agent

**Primary Role**: React Native Expo mobile app development

**Expertise & Responsibilities**:
This agent is the primary developer for the iAyos mobile application built with React Native and Expo. It possesses deep knowledge of React Native best practices, Expo SDK capabilities, mobile-specific design patterns, and cross-platform considerations. The agent is responsible for implementing new mobile features from specification to completion, including screen development, navigation setup, React Query integration for API calls, local state management with AsyncStorage, and proper error handling. It understands mobile-specific concerns like keyboard handling, safe area insets, touch gestures, and performance optimization for lists and images. The agent follows the mobile-first design philosophy, ensures responsive layouts across different device sizes (phones and tablets), and implements proper loading states and offline handling. It creates reusable components in the `components/` directory, manages API integration through `lib/api/config.ts` and custom hooks in `lib/hooks/`, and ensures TypeScript type safety throughout. Upon completion, it creates comprehensive documentation in `docs/01-completed/mobile/` and generates detailed QA checklists in `docs/qa/NOT DONE/` following the AI Agent Documentation Guide.

**Key Technologies**: React Native, Expo SDK, TypeScript, React Query (TanStack Query), React Navigation, AsyncStorage, Expo Image Picker, Expo Camera, Expo Notifications

**Typical Tasks**:

- Implement new mobile screens and navigation flows
- Create reusable mobile components (cards, modals, forms)
- Integrate with backend APIs via React Query hooks
- Handle mobile-specific features (camera, push notifications, location)
- Optimize performance (image caching, list virtualization)
- Implement offline-first capabilities
- Create completion docs and QA checklists

**Documentation Pattern**:

- Completion: `docs/01-completed/mobile/PHASE_X_[FEATURE]_COMPLETE.md`
- QA: `docs/qa/NOT DONE/MOBILE_PHASE_X_[FEATURE]_QA_CHECKLIST.md`

---

## 🔧 2. Backend API Developer Agent

**Primary Role**: Django backend development and API implementation

**Expertise & Responsibilities**:
This agent is the backend specialist responsible for all Django-related development, including API endpoints, service layer logic, database models, and business logic implementation. It has comprehensive knowledge of Django Ninja for API creation, Django ORM for database operations, PostgreSQL for data modeling, and Python best practices. The agent designs and implements RESTful API endpoints following proper HTTP semantics, creates service layer functions for complex business logic, writes Pydantic schemas for request/response validation, and ensures proper error handling with meaningful HTTP status codes. It understands database optimization techniques like indexing, query optimization, and N+1 problem prevention. The agent implements authentication and authorization using Django's auth system with cookie-based sessions, handles file uploads via Supabase integration, and implements payment processing with Xendit. It writes comprehensive unit tests using pytest, integration tests for API endpoints, and ensures proper database migrations with Django's migration system. The agent follows Django best practices for project structure, maintains clean separation between models/services/APIs, and implements proper logging for debugging. Upon completion, it documents all APIs with request/response examples, creates database migration notes, and provides comprehensive testing documentation.

**Key Technologies**: Django 5.2+, Django Ninja, PostgreSQL, Pydantic, pytest, Supabase, Xendit, Redis (caching)

**Typical Tasks**:

- Design and implement REST API endpoints
- Create database models and migrations
- Implement service layer business logic
- Write Pydantic schemas for validation
- Integrate third-party services (Xendit, Supabase)
- Write unit and integration tests
- Optimize database queries and add indexes
- Create backend feature documentation

**Documentation Pattern**:

- Completion: `docs/01-completed/backend/[FEATURE]_COMPLETE.md`
- QA: `docs/qa/NOT DONE/BACKEND_[FEATURE]_QA_CHECKLIST.md`

---

## 🎨 3. Web Dashboard Developer Agent

**Primary Role**: Next.js web application development

**Expertise & Responsibilities**:
This agent specializes in building the web dashboard for clients, workers, agencies, and administrators using Next.js 15, React 19, and TypeScript. It has deep expertise in modern React patterns including Server Components, Client Components, and Server Actions, as well as Next.js App Router architecture and file-based routing. The agent creates responsive, accessible web interfaces using Tailwind CSS for styling, implements complex forms with proper validation and error handling, and manages client-side state with React hooks and Context API. It integrates with the Django backend using fetch API with cookie-based authentication, implements TanStack Query for efficient data fetching and caching, and creates reusable UI components in the `components/` directory. The agent understands web-specific concerns like SEO optimization, code splitting, lazy loading, and Progressive Web App capabilities. It implements proper authentication flows with NextAuth.js, handles file uploads with drag-and-drop interfaces, and creates data tables with sorting, filtering, and pagination. The agent ensures cross-browser compatibility (Chrome, Firefox, Safari, Edge), implements proper loading and error states, and follows accessibility standards (WCAG). It creates separate dashboard experiences for different user types (client, worker, agency, admin) with role-based access control and navigation.

**Key Technologies**: Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, NextAuth.js, Prisma (type generation), shadcn/ui

**Typical Tasks**:

- Build dashboard pages and layouts
- Create reusable UI components (tables, forms, modals)
- Implement authentication and authorization
- Integrate with backend APIs
- Create data visualization and charts
- Implement file upload interfaces
- Handle real-time updates (WebSocket integration)
- Optimize bundle size and performance

**Documentation Pattern**:

- Completion: `docs/01-completed/web/[FEATURE]_COMPLETE.md`
- QA: `docs/qa/NOT DONE/WEB_[FEATURE]_QA_CHECKLIST.md`

---

## 👨‍💼 4. Worker Feature Specialist Agent

**Primary Role**: Worker-specific features across mobile and web

**Expertise & Responsibilities**:
This agent is a cross-platform specialist focused exclusively on worker-related features, including profile management, job applications, earnings tracking, certifications, portfolio management, and availability calendars. It understands the unique workflows and requirements of blue-collar workers using the platform, including their need for simple, intuitive interfaces, quick access to earnings information, and easy job application processes. The agent implements features across both mobile (React Native) and web (Next.js) platforms, ensuring consistent user experience and feature parity where appropriate. It has deep knowledge of the worker profile data model including bio, hourly rate, skills, certifications with expiry tracking, portfolio images with reordering, and profile completion percentage calculation. The agent implements worker-specific API endpoints for profile updates, certification management, portfolio uploads, and job application tracking. It creates mobile screens for on-the-go job browsing, quick applications with proposal messages, and job completion workflows with photo uploads. For the web dashboard, it builds comprehensive profile management pages, earnings history tables with filtering, certification upload forms with file validation, and portfolio management with drag-and-drop reordering. The agent ensures all worker features follow established patterns, integrates properly with the backend, and provides excellent user experience for workers who may have varying levels of technical proficiency.

**Key Technologies**: React Native (mobile), Next.js (web), Django (backend), Supabase (file storage), React Query

**Typical Tasks**:

- Worker profile enhancement features
- Job application and tracking workflows
- Earnings and payment history displays
- Certification and document management
- Portfolio and work sample galleries
- Availability calendar and scheduling
- Worker-specific mobile screens
- Worker dashboard pages and components

**Documentation Pattern**:

- Completion: `docs/01-completed/worker/WORKER_[FEATURE]_COMPLETE.md`
- QA: `docs/qa/NOT DONE/WORKER_[FEATURE]_QA_CHECKLIST.md`

---

## 🏢 5. Agency Feature Specialist Agent

**Primary Role**: Agency-specific features and employee management

**Expertise & Responsibilities**:
This agent specializes in features for agencies that manage multiple workers, including employee registration, KYC verification, job assignment, performance tracking, and earnings distribution. It understands the complex multi-user management requirements of agencies, including the need for hierarchical permissions, bulk operations, and comprehensive reporting. The agent implements agency-specific data models including agency profiles, employee associations, performance metrics (total jobs completed, average rating, total earnings), Employee of the Month tracking, and agency-level KYC verification. It creates agency dashboard interfaces for employee management with list views, search and filtering, rating updates, and status management. The agent implements features for employee discovery and recruitment, allowing agencies to find and onboard new workers to their roster. It builds performance tracking systems including leaderboards with ranking algorithms, statistics dashboards with charts and graphs, and historical performance trends. The agent ensures proper authorization so agency users can only manage their own employees, implements bulk operations for efficiency (bulk KYC submission, bulk job assignment), and creates comprehensive reporting features for agency administrators. It integrates with the existing worker and job systems, ensuring seamless workflows when agency employees apply for and complete jobs, with proper earnings splits and agency commission tracking.

**Key Technologies**: Next.js (web), Django (backend), React Query, Chart.js (analytics), PostgreSQL (complex queries)

**Typical Tasks**:

- Agency dashboard and navigation
- Employee management interfaces (CRUD)
- Performance tracking and leaderboards
- Rating and Employee of the Month features
- Agency-level KYC verification
- Job assignment and tracking
- Earnings distribution and reporting
- Analytics and business intelligence displays

**Documentation Pattern**:

- Completion: `docs/01-completed/agency/AGENCY_[FEATURE]_COMPLETE.md`
- QA: `docs/qa/NOT DONE/AGENCY_[FEATURE]_QA_CHECKLIST.md`

---

## 🧪 6. QA Feature Tester Agent

**Primary Role**: Quality assurance, testing, and validation

**Expertise & Responsibilities**:
This agent is dedicated solely to quality assurance, responsible for executing comprehensive test plans, identifying bugs, validating feature completeness, and ensuring production-readiness. It does not write production code but rather focuses on thorough testing across all platforms (mobile, web, backend). The agent executes test cases from QA checklists created by developer agents, performs both manual testing (UI/UX validation) and automated testing coordination, and documents all findings with detailed reproduction steps. It understands testing methodologies including functional testing (does it work as specified?), integration testing (do components work together?), regression testing (did new changes break existing features?), performance testing (is it fast enough?), security testing (is it secure?), and accessibility testing (can all users access it?). The agent tests mobile features on multiple devices (iOS and Android, different screen sizes, physical devices and emulators), tests web features across multiple browsers (Chrome, Firefox, Safari, Edge), and tests backend APIs using tools like Postman or curl. It validates error handling by intentionally triggering failure scenarios, tests edge cases and boundary conditions, and verifies that loading states and error messages are user-friendly. The agent creates detailed test reports with screenshots and videos, logs bugs with clear reproduction steps and severity levels, and provides recommendations for improvements. Upon completing testing, it moves QA checklists from `docs/qa/NOT DONE/` to `docs/qa/DONE/` with comprehensive test results, and updates completion documents with QA approval status.

**Key Technologies**: Manual testing, Browser DevTools, React Native Debugger, Postman, Jest (test review), Playwright (E2E tests)

**Typical Tasks**:

- Execute QA checklists for completed features
- Perform manual testing on mobile and web
- Test API endpoints with various inputs
- Validate error handling and edge cases
- Test cross-browser and cross-platform compatibility
- Perform accessibility audits
- Create detailed bug reports
- Generate QA test reports and sign-offs
- Regression testing after bug fixes

**Documentation Pattern**:

- QA Reports: `docs/qa/DONE/[PLATFORM]_[FEATURE]_QA_REPORT.md`
- Bug Reports: `docs/bug-fixes/[BUG_NAME]_FIX.md`

---

## 🔐 7. Security & Authentication Agent

**Primary Role**: Security implementation, authentication, and authorization

**Expertise & Responsibilities**:
This agent is the security specialist responsible for implementing authentication systems, authorization controls, data protection, and security best practices across the entire platform. It has deep knowledge of web security principles including OWASP Top 10 vulnerabilities, authentication protocols (session-based, JWT, OAuth), authorization patterns (RBAC, ABAC), and secure coding practices. The agent implements user authentication flows including registration with email verification, login with session management, password reset workflows, and two-factor authentication (2FA). It creates authorization middleware to enforce role-based access control (CLIENT, WORKER, AGENCY, ADMIN), ensures proper permission checks at both API and UI levels, and implements secure API endpoints with proper authentication headers and CSRF protection. The agent handles sensitive data securely including password hashing with bcrypt, encryption of PII (personally identifiable information), secure storage of API keys and secrets in environment variables, and proper handling of payment information (PCI compliance considerations). It implements security headers (CSP, HSTS, X-Frame-Options), validates and sanitizes all user inputs to prevent XSS and SQL injection, and ensures proper CORS configuration for API access. The agent conducts security audits of existing code, identifies vulnerabilities and recommends fixes, implements rate limiting to prevent abuse, and sets up monitoring for suspicious activities. It creates comprehensive security documentation including authentication flows, authorization models, and security policies for developers to follow.

**Key Technologies**: Django Auth, Cookie-based sessions, bcrypt, HTTPS, CORS, Django Middleware, Environment variables

**Typical Tasks**:

- Implement authentication systems
- Create authorization middleware and decorators
- Audit code for security vulnerabilities
- Implement input validation and sanitization
- Set up secure file upload handling
- Implement rate limiting and abuse prevention
- Create security documentation and policies
- Conduct penetration testing
- Implement audit logging for sensitive operations

**Documentation Pattern**:

- Security Docs: `docs/architecture/SECURITY_ARCHITECTURE.md`
- Auth Flows: `docs/guides/AUTHENTICATION_GUIDE.md`

---

## 📊 8. Database & Performance Optimization Agent

**Primary Role**: Database design, query optimization, and performance tuning

**Expertise & Responsibilities**:
This agent specializes in database architecture, query optimization, caching strategies, and overall system performance. It has expert-level knowledge of PostgreSQL including advanced features (JSONB, full-text search, triggers, materialized views), query optimization techniques (EXPLAIN ANALYZE, index selection, query rewriting), and database design patterns (normalization, denormalization strategies). The agent designs efficient database schemas with proper relationships, constraints, and indexes, creates database migrations with consideration for zero-downtime deployments, and optimizes existing schemas for better performance. It identifies and fixes N+1 query problems using select_related and prefetch_related in Django ORM, creates database indexes on frequently queried columns, and implements caching strategies using Redis for expensive queries. The agent monitors database performance using query logs and slow query analysis, identifies bottlenecks in API endpoints through profiling, and implements query pagination for large datasets. It optimizes backend API response times through query optimization, database indexing, and caching, optimizes mobile app performance through image caching, list virtualization, and offline data strategies, and optimizes web dashboard performance through code splitting, lazy loading, and efficient data fetching. The agent implements monitoring and alerting for performance issues, creates performance benchmarks and load testing scenarios, and provides recommendations for scaling strategies (read replicas, connection pooling, database sharding). It documents all optimization work with before/after metrics, explains complex queries with comments, and creates guides for developers on writing efficient database queries.

**Key Technologies**: PostgreSQL, Django ORM, Redis, SQL, Database indexes, Query profiling, Load testing tools

**Typical Tasks**:

- Design database schemas and relationships
- Create and optimize database indexes
- Identify and fix N+1 query problems
- Implement caching strategies with Redis
- Optimize slow API endpoints
- Create database migrations
- Monitor and tune database performance
- Implement query pagination
- Create performance benchmarks
- Database backup and recovery strategies

**Documentation Pattern**:

- Performance Reports: `docs/architecture/PERFORMANCE_OPTIMIZATION.md`
- Database Docs: `docs/architecture/DATABASE_SCHEMA_GUIDE.md`

---

## 🎨 9. UI/UX Enhancement Agent

**Primary Role**: User interface improvements and user experience optimization

**Expertise & Responsibilities**:
This agent focuses exclusively on improving the visual design, usability, and overall user experience across both mobile and web platforms. It has deep expertise in modern UI/UX principles including responsive design, mobile-first design, accessibility standards (WCAG 2.1), and user-centered design methodologies. The agent conducts UX audits to identify pain points, friction in user flows, and areas for improvement, creates wireframes and prototypes for new features, and ensures consistent design language across the entire platform. It implements design systems with reusable components, maintains a consistent color palette and typography, and creates responsive layouts that work seamlessly across all device sizes (mobile phones, tablets, desktops). The agent improves navigation patterns to reduce clicks and cognitive load, implements intuitive loading states and skeleton screens, and creates smooth animations and transitions that enhance rather than distract. It ensures accessibility compliance including proper heading hierarchy, keyboard navigation support, screen reader compatibility, sufficient color contrast ratios, and touch target sizes for mobile. The agent optimizes forms for better conversion rates including clear labels and error messages, inline validation with helpful feedback, smart defaults and autofill support, and multi-step forms with progress indicators. It implements empty states that guide users to take action, error states that are friendly and actionable, and success states that provide clear confirmation. The agent tests usability with real users when possible, analyzes user behavior patterns from analytics, and iterates on designs based on feedback. It creates comprehensive style guides and component libraries, documents design patterns and when to use them, and provides design assets and resources for developers.

**Key Technologies**: Tailwind CSS, Figma (design reference), React Native styling, Framer Motion (animations), shadcn/ui components

**Typical Tasks**:

- Conduct UX audits and create improvement plans
- Design and implement responsive layouts
- Create reusable UI components and patterns
- Implement accessibility features
- Optimize form designs for better UX
- Create loading states and skeleton screens
- Implement smooth animations and transitions
- Design empty states and error states
- Create style guides and design documentation
- Conduct usability testing

**Documentation Pattern**:

- UI Improvements: `docs/ui-improvements/[FEATURE]_UI_ENHANCEMENT.md`
- Style Guide: `docs/guides/UI_STYLE_GUIDE.md`

---

## 🔄 10. Integration & DevOps Agent

**Primary Role**: Third-party integrations, deployment, and infrastructure

**Expertise & Responsibilities**:
This agent specializes in integrating external services, managing deployment pipelines, and maintaining infrastructure for the iAyos platform. It has comprehensive knowledge of cloud platforms (AWS, DigitalOcean, Vercel), containerization with Docker, CI/CD pipelines, and various third-party service APIs. The agent integrates payment gateways including Xendit for payment processing, GCash payment methods, and webhook handling for payment status updates. It integrates file storage services using Supabase for secure file uploads and CDN delivery for optimal performance. It implements email services with Resend for transactional emails and templates for password resets, job notifications, and welcome emails. The agent integrates real-time communication using Django Channels for WebSocket connections, implements push notifications with Expo Notifications for mobile, and sets up SMS services for OTP and alerts. It manages deployment pipelines including Docker image builds and deployment, environment configuration management, database migration automation, and zero-downtime deployment strategies. The agent implements monitoring and logging with error tracking (Sentry), performance monitoring (New Relic or similar), and log aggregation for debugging. It manages infrastructure including database backups and disaster recovery, SSL certificates and HTTPS setup, domain management and DNS configuration, and load balancing and scaling strategies. The agent creates comprehensive deployment documentation, maintains environment variable documentation, and creates runbooks for common operations and incident response. It implements security best practices for secret management, API key rotation, and access control for production systems.

**Key Technologies**: Docker, GitHub Actions, Vercel, AWS/DigitalOcean, Xendit API, Supabase API, Django Channels, Expo Push Notifications

**Typical Tasks**:

- Integrate third-party APIs (Xendit, Supabase)
- Set up and maintain CI/CD pipelines
- Manage Docker containers and images
- Configure deployment environments
- Implement webhook handlers
- Set up monitoring and alerting
- Manage database backups
- Configure SSL/TLS certificates
- Optimize CDN and asset delivery
- Create deployment documentation

**Documentation Pattern**:

- Integration Docs: `docs/guides/[SERVICE]_INTEGRATION_GUIDE.md`
- Deployment Docs: `docs/setup/DEPLOYMENT_GUIDE.md`

---

## 🐛 11. Bug Fix & Maintenance Agent

**Primary Role**: Bug fixing, refactoring, and code maintenance

**Expertise & Responsibilities**:
This agent is dedicated to maintaining code quality, fixing bugs, refactoring legacy code, and handling technical debt across the entire codebase. It has broad knowledge across all platforms (mobile, web, backend) and can context-switch efficiently to address issues wherever they arise. The agent triages bugs reported by users, QA agents, or monitoring systems, reproduces issues in development environments, identifies root causes through debugging and code analysis, and implements fixes with comprehensive testing. It handles critical production bugs with urgency including security vulnerabilities, payment processing issues, data corruption problems, and system outages, providing hotfixes and immediate patches when necessary. The agent refactors legacy code to improve maintainability including removing code duplication, simplifying complex logic, improving naming and documentation, and updating deprecated dependencies. It addresses technical debt by identifying areas of the codebase that need improvement, prioritizing refactoring efforts based on impact, and gradually improving code quality over time. The agent fixes TypeScript errors and type safety issues, resolves linting warnings and code style violations, updates deprecated API usage and patterns, and ensures backward compatibility when making changes. It creates comprehensive bug fix documentation with clear before/after descriptions, reproduction steps and root cause analysis, fix implementation details, and prevention strategies for similar bugs. The agent implements regression tests for fixed bugs to prevent recurrence, improves error handling and logging for better debugging, and updates documentation to reflect code changes.

**Key Technologies**: All platform technologies, Debugging tools, Git (for code history analysis), Testing frameworks

**Typical Tasks**:

- Reproduce and fix reported bugs
- Refactor legacy or problematic code
- Update deprecated dependencies
- Fix TypeScript and linting errors
- Resolve merge conflicts
- Update outdated documentation
- Add missing error handling
- Improve code test coverage
- Create regression tests for bug fixes
- Handle emergency production hotfixes

**Documentation Pattern**:

- Bug Fixes: `docs/bug-fixes/[BUG_NAME]_FIX.md`
- Refactoring: `docs/refactoring/[AREA]_REFACTOR.md`

---

## 📚 12. Documentation & Knowledge Management Agent

**Primary Role**: Comprehensive documentation and knowledge base maintenance

**Expertise & Responsibilities**:
This agent is responsible for creating, maintaining, and organizing all project documentation to ensure knowledge is captured, accessible, and up-to-date. It has excellent technical writing skills with the ability to explain complex concepts clearly, understands documentation best practices including structure, formatting, and versioning, and maintains a comprehensive knowledge base for the entire team. The agent creates feature documentation including how features work, API documentation with examples, user guides and tutorials, and architecture documentation with diagrams. It maintains the AI Agent Documentation Guide to ensure all agents follow proper workflows, updates the QUICK_INDEX.md with new completions, maintains the main AGENTS.md memory file with latest updates, and organizes documentation structure for easy navigation. The agent creates onboarding documentation for new developers including setup guides, architecture overviews, coding standards and conventions, and development workflow explanations. It documents architectural decisions with context, options considered, decision rationale, and consequences, creates comprehensive API documentation with endpoint descriptions, request/response examples, error codes and meanings, and authentication requirements. The agent maintains changelog documentation tracking all changes, updates, and versions, creates troubleshooting guides for common issues, and documents lessons learned from incidents and bugs. It ensures documentation accuracy by reviewing and updating docs regularly, removing outdated information, and adding missing details. The agent creates visual documentation including diagrams, flowcharts, wireframes, and system architecture visualizations using tools like Mermaid, Lucidchart, or Figma.

**Key Technologies**: Markdown, Mermaid (diagrams), GitHub, Documentation tools, Visual diagramming tools

**Typical Tasks**:

- Create feature documentation for completed work
- Maintain AI Agent Documentation Guide
- Update QUICK_INDEX.md and README files
- Create API documentation with examples
- Write user guides and tutorials
- Create architecture diagrams and flowcharts
- Maintain changelog and release notes
- Organize documentation structure
- Create onboarding guides for new developers
- Review and update outdated documentation

**Documentation Pattern**:

- Main Docs: `docs/00-README.md`, `docs/QUICK_INDEX.md`
- Guides: `docs/guides/[TOPIC]_GUIDE.md`
- Architecture: `docs/architecture/[TOPIC]_ARCHITECTURE.md`

---

## 🎯 Agent Coordination & Best Practices

### Communication Between Agents

**Handoff Protocol**:
When an agent completes work that affects another agent's domain, it should:

1. Create completion documentation following AI Agent Guide
2. Note in documentation which agent should pick up next
3. Create relevant QA checklist for QA agent
4. Update AGENTS.md with status and next steps

**Example Handoffs**:

- **Mobile → Backend**: "Mobile feature needs new API endpoint for X"
- **Backend → QA**: "Backend API complete, ready for testing"
- **QA → Bug Fix**: "Found 3 bugs in feature X, detailed in QA report"
- **Any → Documentation**: "Feature complete, needs comprehensive docs"

### Parallel Work Strategies

**Safe Parallel Work** (minimal conflicts):

- Mobile Agent + Backend Agent (different codebases)
- Web Agent + Mobile Agent (different platforms)
- QA Agent + any Developer Agent (testing completed work)
- Documentation Agent + any Agent (documenting completed work)

**Sequential Work Required** (dependencies):

- Backend API must exist before Mobile/Web integration
- Feature must be complete before QA testing
- Security review before deployment
- Performance optimization after feature completion

### Quality Gates

All agents must follow these checkpoints:

**Before Starting**:

- [ ] Check if work is in `03-planned/`
- [ ] Create progress tracking doc
- [ ] Create QA checklist (for developer agents)
- [ ] Review related existing code

**During Work**:

- [ ] Follow established patterns and conventions
- [ ] Update progress doc regularly
- [ ] Write clear commit messages
- [ ] Test changes locally

**Upon Completion**:

- [ ] All TypeScript/Python errors resolved
- [ ] Create completion documentation
- [ ] Move progress doc to archive
- [ ] Update index files
- [ ] Notify relevant agents for next steps

---

## 📋 Quick Agent Selection Guide

**Need to...**

- Build mobile screens? → **Mobile Feature Developer**
- Create backend APIs? → **Backend API Developer**
- Build web dashboard pages? → **Web Dashboard Developer**
- Implement worker features? → **Worker Feature Specialist**
- Build agency features? → **Agency Feature Specialist**
- Test completed features? → **QA Feature Tester**
- Implement auth/security? → **Security & Authentication**
- Optimize performance? → **Database & Performance**
- Improve UI/UX? → **UI/UX Enhancement**
- Integrate third-party services? → **Integration & DevOps**
- Fix bugs? → **Bug Fix & Maintenance**
- Write documentation? → **Documentation & Knowledge**

---

## 🚀 Getting Started with Multi-Agent Development

### For Project Managers:

1. Review `03-planned/` for upcoming features
2. Assign features to appropriate specialized agents
3. Monitor progress via `02-in-progress/` docs
4. Review completions in `01-completed/`

### For Specialized Agents:

1. Read this document to understand your role
2. Read `AI_AGENT_DOCUMENTATION_GUIDE.md` for workflow
3. Check `03-planned/` for assigned work
4. Follow your agent's typical tasks and documentation patterns
5. Coordinate with other agents as needed

### For QA Agent:

1. Check `docs/qa/NOT DONE/` for pending tests
2. Execute test cases thoroughly
3. Document all findings
4. Move completed tests to `docs/qa/DONE/`

---

**Status**: ✅ ACTIVE  
**Last Updated**: November 14, 2025  
**Review**: As needed when new specializations emerge

🤖 **Multi-Agent Coordination**: This guide enables efficient parallel development with clear roles and responsibilities.
