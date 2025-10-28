import { Hono } from 'hono'
import { authMiddleware, getCurrentUser, getUserQuota, requirePremium } from '../middleware/auth'

const app = new Hono()

// Get current user profile (requires authentication)
app.get('/profile', authMiddleware({ required: true }), async c => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
    subscription_tier: user.subscription_tier,
    preferences: user.preferences,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    quotas: {
      daily_api_limit: user.dailyApiLimit,
      max_file_size: user.maxFileSize,
      max_execution_time: user.maxExecutionTime,
      file_retention_hours: user.getFileRetentionHours(),
    },
  })
})

// Update user profile (requires authentication)
app.put('/profile', authMiddleware({ required: true }), async c => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  try {
    const body = await c.req.json()

    // This would typically use a UserService to update the user
    // For now, just return the updated profile structure
    return c.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: body.name || user.name,
        avatar_url: body.avatar_url || user.avatar_url,
        preferences: {
          ...user.preferences,
          ...body.preferences,
        },
      },
    })
  } catch (_error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Get user statistics (requires premium)
app.get('/stats', requirePremium(), async c => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  // This would typically fetch real statistics from the database
  return c.json({
    user_id: user.id,
    api_usage: {
      daily_requests: 45,
      daily_limit: user.dailyApiLimit,
      monthly_requests: 1250,
    },
    files: {
      total_uploaded: 23,
      total_size: 1024000, // bytes
      storage_used: 512000, // bytes
    },
    jobs: {
      total_completed: 89,
      total_failed: 3,
      average_execution_time: 1250, // milliseconds
    },
    quota_remaining: getUserQuota(c),
  })
})

// Change subscription tier (requires authentication)
app.post('/subscription', authMiddleware({ required: true }), async c => {
  const user = getCurrentUser(c)

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  try {
    const body = await c.req.json()
    const { tier } = body

    if (!['free', 'pro', 'enterprise'].includes(tier)) {
      return c.json({ error: 'Invalid subscription tier' }, 400)
    }

    // This would typically integrate with a payment processor
    // For now, just simulate the change
    return c.json({
      message: `Subscription updated to ${tier}`,
      user: {
        id: user.id,
        email: user.email,
        subscription_tier: tier,
        new_quotas: {
          daily_api_limit: tier === 'free' ? 100 : tier === 'pro' ? 1000 : 10000,
          max_file_size: tier === 'free' ? 10485760 : tier === 'pro' ? 52428800 : 524288000,
          max_execution_time: tier === 'free' ? 5000 : tier === 'pro' ? 15000 : 60000,
        },
      },
    })
  } catch (_error) {
    return c.json({ error: 'Invalid request body' }, 400)
  }
})

// Public user information (no authentication required)
app.get('/:id', async c => {
  const userId = c.req.param('id')

  // This would typically fetch user data from the database
  // For now, just return a placeholder
  return c.json({
    id: userId,
    name: 'Public User',
    avatar_url: null,
    subscription_tier: 'free',
    created_at: Math.floor(Date.now() / 1000),
  })
})

// Admin-only endpoint (requires enterprise tier)
app.get(
  '/admin/dashboard',
  authMiddleware({
    required: true,
    roles: ['enterprise'],
  }),
  async c => {
    const user = getCurrentUser(c)

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // This would typically fetch real admin data
    return c.json({
      dashboard: {
        total_users: 1250,
        active_sessions: 342,
        daily_requests: 15420,
        system_health: 'operational',
        revenue: {
          monthly: 12500,
          yearly: 150000,
        },
      },
      user: {
        id: user.id,
        email: user.email,
        role: 'administrator',
      },
    })
  }
)

// Legacy routes (will be implemented in Phase 3.4)
app.get('/', async c => {
  return c.json(
    {
      message: 'Use /profile for current user info or /:id for specific user',
      endpoints: {
        profile: 'GET /users/profile',
        update_profile: 'PUT /users/profile',
        stats: 'GET /users/stats (premium only)',
        subscription: 'POST /users/subscription',
        admin_dashboard: 'GET /users/admin/dashboard (enterprise only)',
        public_user: 'GET /users/:id',
      },
    },
    200
  )
})

export { app as users }
