# Environment Variables Documentation

## Overview
This document describes all environment variables used in the Property Management System backend.

## Setup Instructions

1. **Copy the template**: Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your values**: Edit `.env.local` with your actual Supabase credentials

3. **Verify configuration**: Run the environment test to ensure variables are loaded correctly

## Required Variables

### Server Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment (development/production) |
| `PORT` | No | `3001` | Port for the backend server |

### Frontend Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for CORS configuration |

### Supabase Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_URL` | Yes | Test URL | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Test key | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | None | Service role key (admin operations only) |

### Security Configuration (Optional)
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | No | None | JWT signing secret |
| `SESSION_SECRET` | No | None | Session cookie encryption secret |

### Development Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEBUG` | No | `false` | Enable debug logging |
| `SQL_DEBUG` | No | `false` | Enable SQL query logging |

## Environment Files

### `.env.example`
Template file with all available variables and documentation. **Safe to commit to git.**

### `.env.local`
Local development configuration with your actual values. **Never commit to git.**

### `.env.production` (when needed)
Production configuration. **Never commit to git.**

## Security Best Practices

1. **Never commit real credentials** to version control
2. **Keep service role keys secret** - only use server-side
3. **Use strong secrets** for JWT and session keys in production
4. **Set NODE_ENV=production** in production environments
5. **Disable debug logging** in production

## Testing Configuration

Run the environment test to verify your configuration:
```bash
node tmp/test_environment.js
```

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure `.env.local` exists
   - Check that required variables are set
   - Verify file permissions

2. **"Cannot connect to Supabase"**
   - Verify SUPABASE_URL format
   - Check SUPABASE_ANON_KEY is correct
   - Ensure network connectivity

3. **"CORS errors in frontend"**
   - Check FRONTEND_URL matches your frontend URL
   - Ensure CORS is properly configured

### Getting Help

1. Check this documentation
2. Verify your `.env.local` against `.env.example`
3. Run the environment test script
4. Check server logs for detailed error messages