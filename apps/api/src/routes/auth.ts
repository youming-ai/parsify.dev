import { Hono } from 'hono'
import {
  authMiddleware,
  authRateLimit,
  getCurrentUser,
  isAuthenticated,
  optionalAuth,
} from '../middleware/auth'

const app = new Hono()

// Apply rate limiting to all auth routes
app.use('*', authRateLimit())

// Session Management Routes (will be implemented in Phase 3.4)
app.post('/session', async c => {
  return c.json({ error: 'Not implemented yet' }, 501)
})

// Validate current session
app.get('/validate', optionalAuth(), async c => {
  const user = getCurrentUser(c)

  if (!user || !isAuthenticated(c)) {
    return c.json(
      {
        valid: false,
        message: 'No valid session found',
      },
      401
    )
  }

  return c.json({
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_tier: user.subscription_tier,
    },
    session_id: c.get('auth').sessionId,
  })
})

// Refresh token
app.post('/refresh', authMiddleware({ required: true }), async c => {
  const auth = c.get('auth')

  // Token refresh is handled automatically by the middleware
  // Here we can return the current session info
  return c.json({
    refreshed: true,
    session_id: auth.sessionId,
    user: auth.user
      ? {
          id: auth.user.id,
          email: auth.user.email,
          name: auth.user.name,
          subscription_tier: auth.user.subscription_tier,
        }
      : null,
  })
})

// Logout (requires authentication)
app.post('/logout', authMiddleware({ required: true }), async c => {
  const auth = c.get('auth')
  const cloudflare = c.get('cloudflare')

  try {
    // Delete session from KV
    if (auth.sessionId) {
      await cloudflare.cacheDelete('sessions', `session:${auth.sessionId}`)
    }

    return c.json({
      success: true,
      message: 'Logged out successfully',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return c.json(
      {
        success: false,
        message: 'Failed to logout',
      },
      500
    )
  }
})

export { app as auth }
