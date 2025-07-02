# Development Guide

## Project Overview

This is an AI-powered property and inventory management system with QR code generation capabilities.

**Tech Stack:**
- **Frontend**: Next.js 15.3.4 with TypeScript and Tailwind CSS
- **Backend**: Express.js with Node.js
- **Database**: Supabase (PostgreSQL)
- **QR Generation**: qrcode library
- **Development**: Hot reloading with nodemon and Next.js dev server

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd property-management-system
npm run setup
```

### 2. Environment Configuration

Copy environment templates and configure:

```bash
# Backend environment
cp backend/.env.example backend/.env.local

# Frontend environment (if needed)
cp frontend/.env.example frontend/.env.local
```

Update the environment files with your Supabase credentials:

```bash
# backend/.env.local
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=development
PORT=3001
```

### 3. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start individually:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:3000
```

## Development Workflow

### File Structure

```
property-management-system/
├── backend/                 # Express.js API server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── migrations/        # Database migrations
│   └── server.js          # Main server file
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # Next.js 13+ app directory
│   │   ├── components/   # React components
│   │   └── lib/         # Utilities and API clients
│   └── public/          # Static assets
└── docs/                # Documentation
```

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build both applications
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run setup` - Install all dependencies

#### Backend Specific
- `npm run dev:backend` - Start backend with hot reload
- `npm run build:backend` - Build backend
- `npm run start:backend` - Start production backend

#### Frontend Specific
- `npm run dev:frontend` - Start frontend with hot reload
- `npm run build:frontend` - Build frontend for production
- `npm run start:frontend` - Start production frontend

### Hot Reloading

**Backend Hot Reloading (nodemon):**
- Automatically restarts server on file changes
- Watches all `.js` files in the backend directory
- Excludes `node_modules` and `.git` directories

**Frontend Hot Reloading (Next.js):**
- Fast refresh for React components
- Automatic page reloads on file changes
- CSS and component state preservation

### API Development

**Backend API Structure:**
- Base URL: `http://localhost:3001/api`
- Health check: `GET /health`
- Properties: `/api/properties`
- Items: `/api/items`
- QR Codes: `/api/qr-codes`

**Testing API Endpoints:**
- Use the built-in API test page: `http://localhost:3000/api-test`
- Use tools like Postman, curl, or Thunder Client

### Database Development

**Supabase Configuration:**
- Database connection configured in `backend/config/database.js`
- Migration files in `backend/migrations/`
- Demo data available for testing

**Running Migrations:**
```bash
# Apply migrations manually through Supabase dashboard
# Or use SQL scripts in migrations/ directory
```

## Component Development

### Frontend Components

**Shared Components** (`frontend/src/components/shared/`):
- `Layout.tsx` - Main application layout with navigation
- `ErrorBoundary.tsx` - Error handling wrapper

**UI Components** (`frontend/src/components/ui/`):
- `Loading.tsx` - Loading spinners and skeletons

**Dashboard Components** (`frontend/src/components/dashboard/`):
- Property management components
- Item management components
- QR code generation components

### Styling

**Tailwind CSS Configuration:**
- Custom property management theme
- Responsive design utilities
- Custom color scheme for property management

**Design Tokens:**
```css
/* Primary colors for property management */
--color-primary: #2563eb    /* Blue for actions */
--color-secondary: #64748b  /* Slate for secondary elements */
--color-accent: #059669     /* Green for success states */
```

## Testing

### Manual Testing Checklist

**Backend Testing:**
- [ ] Server starts on port 3001
- [ ] Health endpoint responds: `GET /health`
- [ ] CORS configured for frontend requests
- [ ] Environment variables loaded correctly

**Frontend Testing:**
- [ ] Next.js dev server starts on port 3000
- [ ] Layout renders with navigation
- [ ] API test page connects to backend
- [ ] Hot reload works for component changes

**Integration Testing:**
- [ ] Frontend can make requests to backend
- [ ] CORS allows cross-origin requests
- [ ] Error handling works across stack

## Debugging

### Common Issues

**Port Conflicts:**
```bash
# Check what's running on ports
lsof -i :3000  # Frontend
lsof -i :3001  # Backend

# Kill processes if needed
kill -9 <PID>
```

**Environment Variables:**
- Ensure `.env.local` files exist in both directories
- Check variable names match exactly
- Restart servers after changing environment variables

**Database Connection:**
- Verify Supabase credentials
- Check network connectivity
- Test connection in Supabase dashboard

### Development Logs

**Backend Logs:**
- Request logging via Morgan middleware
- Custom logger in `backend/config/logger.js`
- Error logs include stack traces

**Frontend Logs:**
- Browser console for client-side issues
- Next.js build output for compilation errors

## Performance Optimization

### Development Performance
- Use `npm run dev` for concurrent startup
- Enable hot reloading for faster development
- Use browser dev tools for frontend debugging

### Build Performance
- Frontend build outputs static files
- Backend uses production-ready Express setup
- Environment-specific configurations

## Contributing

### Code Style
- ESLint configuration for consistent code style
- Prettier for code formatting
- TypeScript for type safety

### Git Workflow
- Use conventional commit messages: `[001-X] Description`
- Follow task numbering from implementation guide
- Create branches for features: `feature/task-X-description`

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Follow commit message conventions
4. Request code review

## Production Deployment

### Build Process
```bash
npm run build
```

### Environment Setup
- Configure production environment variables
- Set up Supabase production database
- Configure domain and SSL certificates

### Deployment Commands
```bash
# Backend deployment
cd backend && npm run start

# Frontend deployment
cd frontend && npm run start
```

## Troubleshooting

### Common Development Issues

1. **"Cannot find module" errors**: Run `npm install` in the affected directory
2. **Port already in use**: Change ports in configuration or kill existing processes  
3. **CORS errors**: Check backend CORS configuration allows frontend origin
4. **Build failures**: Clear `.next` cache and `node_modules`, reinstall dependencies

### Getting Help

- Check documentation in `docs/` directory
- Review implementation guide: `docs/req-001-Sprint1-ContentCreation-QRGeneration-Detailed.md`
- Test API connectivity using `/api-test` page
- Enable debug logging for detailed information

---

**Last Updated**: July 2025  
**Version**: 1.0.0