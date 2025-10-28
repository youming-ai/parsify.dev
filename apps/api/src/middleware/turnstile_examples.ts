/**
 * Turnstile Middleware Usage Examples
 *
 * This file demonstrates various ways to use the Turnstile middleware
 * for bot protection in different scenarios.
 */

import { Hono } from 'hono'
import { authMiddleware } from './auth'
import { errorMiddleware } from './error'
import { rateLimitMiddleware } from './rate_limit'
import {
  createHighProtection,
  createLowProtection,
  createMaximumProtection,
  createMediumProtection,
  getBotRiskScore,
  getTurnstileContext,
  isBotDetected,
  optionalTurnstile,
  requireTurnstile,
  turnstileMiddleware,
} from './turnstile'

// Create Hono app
const app = new Hono()

// Error handling middleware (should be first)
app.use('*', errorMiddleware())

/**
 * Example 1: Basic Turnstile Protection
 * Apply Turnstile validation to all routes
 */
app.use(
  '/api/*',
  turnstileMiddleware({
    required: true,
    config: {
      siteKey: process.env.TURNSTILE_SITE_KEY!,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      protectionLevel: 'medium',
    },
  })
)

app.get('/api/public', c => {
  return c.json({ message: 'Public endpoint with Turnstile protection' })
})

/**
 * Example 2: Required Turnstile for Sensitive Operations
 * Use requireTurnstile helper for endpoints that must have valid Turnstile tokens
 */
app.post('/api/users/register', requireTurnstile('register'), async c => {
  const { email, password } = await c.req.json()

  // Registration logic here
  return c.json({
    success: true,
    message: 'User registered successfully',
  })
})

/**
 * Example 3: Optional Turnstile with Risk Assessment
 * Use optionalTurnstile to collect risk information without blocking
 */
app.post('/api/contact', optionalTurnstile('contact'), async c => {
  const turnstileContext = getTurnstileContext(c)
  const riskScore = getBotRiskScore(c)

  // Log submission with risk assessment
  console.log('Contact form submission:', {
    riskScore,
    hasValidToken: !!turnstileContext?.validationResponse?.success,
    botDetected: isBotDetected(c),
  })

  const { name, email, message } = await c.req.json()

  // Process contact form submission
  return c.json({
    success: true,
    message: 'Contact form submitted successfully',
  })
})

/**
 * Example 4: Protection Levels
 * Different protection levels for different types of endpoints
 */

// Low protection for public content
app.get('/api/content/*', createLowProtection(), async c => {
  return c.json({ content: 'Public content with low protection' })
})

// Medium protection for general API
app.post('/api/data/*', createMediumProtection(), async c => {
  return c.json({ data: 'API data with medium protection' })
})

// High protection for sensitive operations
app.delete(
  '/api/users/:userId',
  authMiddleware({ required: true }),
  createHighProtection(),
  async c => {
    const { userId } = c.req.param()
    return c.json({ message: `User ${userId} deleted` })
  }
)

// Maximum protection for critical operations
app.post(
  '/api/admin/reset-password',
  authMiddleware({ required: true, roles: ['admin'] }),
  createMaximumProtection(),
  async c => {
    return c.json({ message: 'Password reset initiated' })
  }
)

/**
 * Example 5: Custom Validation Logic
 * Implement custom validation based on business logic
 */
app.post(
  '/api/sensitive-action',
  turnstileMiddleware({
    required: true,
    config: {
      siteKey: process.env.TURNSTILE_SITE_KEY!,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      protectionLevel: 'high',
    },
    customValidation: async (_token, _context) => {
      // Custom validation logic
      const auth = c.get('auth')

      // Additional checks for high-value operations
      if (auth.user && auth.user.accountAge < 7 * 24 * 60 * 60 * 1000) {
        // Require additional verification for new accounts
        return false
      }

      // Check if user has recent suspicious activity
      const recentActivity = await checkRecentActivity(auth.user?.id)
      if (recentActivity.suspiciousCount > 3) {
        return false
      }

      return true
    },
  }),
  async c => {
    return c.json({ message: 'Sensitive action completed' })
  }
)

/**
 * Example 6: Integration with Rate Limiting
 * Combine Turnstile with rate limiting for enhanced protection
 */
app.post(
  '/api/process-data',
  authMiddleware({ required: false }),
  turnstileMiddleware({
    required: false,
    config: {
      siteKey: process.env.TURNSTILE_SITE_KEY!,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      protectionLevel: 'medium',
    },
  }),
  rateLimitMiddleware({
    requests: 100,
    window: 3600,
    keyGenerator: c => {
      const turnstileContext = getTurnstileContext(c)
      const auth = c.get('auth')

      // Use user ID for authenticated users
      if (auth.user) {
        return `user:${auth.user.id}`
      }

      // Use Turnstile token for unauthenticated users with valid tokens
      if (turnstileContext?.validationResponse?.success) {
        return `turnstile:${turnstileContext.token?.substring(0, 20)}`
      }

      // Fall back to IP address
      return `ip:${c.req.header('CF-Connecting-IP') || 'unknown'}`
    },
  }),
  async c => {
    return c.json({ message: 'Data processed successfully' })
  }
)

/**
 * Example 7: Custom Error Handling
 * Implement custom error responses for Turnstile failures
 */
app.post(
  '/api/submit-form',
  turnstileMiddleware({
    required: true,
    config: {
      siteKey: process.env.TURNSTILE_SITE_KEY!,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    },
    onError: (c, error, _validationResult) => {
      // Custom error handling
      switch (error) {
        case 'MISSING_TOKEN':
          return c.json(
            {
              error: 'Human verification required',
              message: 'Please complete the security check to submit this form',
              requiresTurnstile: true,
              siteKey: process.env.TURNSTILE_SITE_KEY,
            },
            403
          )

        case 'INVALID_TOKEN':
        case 'VALIDATION_FAILED':
          return c.json(
            {
              error: 'Security check failed',
              message: 'The security check could not be verified. Please try again.',
              retry: true,
            },
            403
          )

        case 'BOT_DETECTED':
          return c.json(
            {
              error: 'Access denied',
              message: 'Your request has been blocked for security reasons.',
              blockReason: 'bot_activity',
            },
            403
          )

        default:
          return c.json(
            {
              error: 'Security service unavailable',
              message: 'We are unable to verify your request at this time. Please try again later.',
              retry: true,
            },
            503
          )
      }
    },
  }),
  async c => {
    return c.json({ message: 'Form submitted successfully' })
  }
)

/**
 * Example 8: Success Callbacks
 * Handle successful Turnstile validations
 */
app.post(
  '/api/secure-action',
  turnstileMiddleware({
    required: true,
    config: {
      siteKey: process.env.TURNSTILE_SITE_KEY!,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    },
    onSuccess: async (c, result) => {
      // Log successful validation
      const _turnstileContext = getTurnstileContext(c)

      await logSecurityEvent({
        event: 'turnstile_success',
        action: result.action,
        riskScore: getBotRiskScore(c),
        ip: c.req.header('CF-Connecting-IP'),
        userAgent: c.req.header('User-Agent'),
        timestamp: new Date().toISOString(),
      })
    },
  }),
  async c => {
    return c.json({ message: 'Secure action completed' })
  }
)

/**
 * Example 9: Action-Based Validation
 * Different validation rules for different actions
 */
app.post(
  '/api/action/:action',
  turnstileMiddleware({
    required: true,
    action: c => c.req.param('action'),
    config: {
      siteKey: process.env.TURNSTILE_SITE_KEY!,
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
      protectionLevel: 'medium',
    },
  }),
  async c => {
    const { action } = c.req.param()
    const turnstileContext = getTurnstileContext(c)

    // Verify the action matches the validated action
    if (turnstileContext?.validationResponse?.action !== action) {
      return c.json({ error: 'Action mismatch' }, 400)
    }

    return c.json({
      message: `Action '${action}' completed successfully`,
      validatedAction: turnstileContext?.validationResponse?.action,
    })
  }
)

/**
 * Example 10: Conditional Turnstile Based on Risk
 * Apply Turnstile conditionally based on risk factors
 */
app.post(
  '/api/conditional-endpoint',
  async (c, next) => {
    // Pre-check risk factors
    const clientIP = c.req.header('CF-Connecting-IP')
    const userAgent = c.req.header('User-Agent')

    // Determine if Turnstile is required
    const riskFactors = analyzeRiskFactors(clientIP, userAgent)
    const requiresTurnstile = riskFactors.score > 0.5

    // Apply Turnstile middleware if needed
    if (requiresTurnstile) {
      await turnstileMiddleware({
        required: true,
        config: {
          siteKey: process.env.TURNSTILE_SITE_KEY!,
          secretKey: process.env.TURNSTILE_SECRET_KEY!,
          protectionLevel: 'medium',
        },
      })(c, next)
    } else {
      await next()
    }
  },
  async c => {
    return c.json({ message: 'Request processed successfully' })
  }
)

// Helper functions for examples
async function checkRecentActivity(_userId?: string) {
  // Mock implementation
  return { suspiciousCount: 0 }
}

async function logSecurityEvent(event: any) {
  // Mock implementation
  console.log('Security event logged:', event)
}

function analyzeRiskFactors(_ip?: string, _userAgent?: string) {
  // Mock implementation
  return { score: 0.3 }
}

/**
 * Example 11: Frontend Integration Examples
 *
 * These examples show how the frontend should integrate with the Turnstile middleware
 */

// Frontend JavaScript example for adding Turnstile to a form
const _frontendExample = `
<!-- Add Turnstile script to your HTML -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- HTML form with Turnstile -->
<form id="contactForm">
  <input type="email" name="email" placeholder="Your email" required>
  <textarea name="message" placeholder="Your message" required></textarea>

  <!-- Turnstile widget -->
  <div class="cf-turnstile"
       data-sitekey="${process.env.TURNSTILE_SITE_KEY}"
       data-callback="onTurnstileSuccess">
  </div>

  <button type="submit">Send Message</button>
</form>

<script>
function onTurnstileSuccess(token) {
  // Token is automatically included in form submission
  console.log('Turnstile validation successful');
}

// Handle form submission
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      alert('Message sent successfully!');
      e.target.reset();
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
});
</script>
`

// Programmatic Turnstile token generation
const _programmaticExample = `
// For AJAX requests or single-page applications
function getTurnstileToken() {
  return new Promise((resolve, reject) => {
    if (typeof turnstile === 'undefined') {
      reject(new Error('Turnstile not loaded'));
      return;
    }

    turnstile.render('#turnstile-container', {
      sitekey: '${process.env.TURNSTILE_SITE_KEY}',
      callback: resolve,
      'error-callback': reject
    });
  });
}

// Use in API call
async function makeApiRequest(data) {
  try {
    const token = await getTurnstileToken();

    const response = await fetch('/api/secure-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Turnstile-Token': token
      },
      body: JSON.stringify(data)
    });

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
`

export default app
