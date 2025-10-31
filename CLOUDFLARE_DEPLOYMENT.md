# Cloudflare Pages Deployment Guide

## Problem
Your Cloudflare Pages deployment is failing because it's still using the deprecated `@cloudflare/next-on-pages` package instead of the new OpenNext adapter.

## Solution

### 1. Update Cloudflare Pages Build Command

Go to your Cloudflare Pages project dashboard:

1. Navigate to your project in the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Settings** → **Build & deployments**
3. Under **Build command**, replace the existing command with:
   ```
   pnpm run build
   ```

### 2. Verify Build Output Directory

Make sure the **Build output directory** is set to:
```
.open-next
```

### 3. Environment Variables

Ensure these environment variables are set in your Cloudflare Pages dashboard:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |

### 4. Local Testing

To test the build locally before deploying:

```bash
# Install dependencies
pnpm install

# Build the project (this creates the .open-next directory)
pnpm run build

# Verify the .open-next directory was created
ls -la .open-next
```

## What Changed

- ✅ Updated from deprecated `@cloudflare/next-on-pages` to `@opennextjs/cloudflare`
- ✅ Updated `package.json` with correct build scripts
- ✅ Updated `wrangler.toml` with proper output directory configuration
- ✅ Local build is working and generating the `.open-next` directory

## Next Steps

1. Update your Cloudflare Pages build command as described above
2. Commit and push these changes to trigger a new deployment
3. The deployment should now succeed with the new OpenNext adapter

## Troubleshooting

If deployment still fails:

1. Make sure you're using `pnpm run build` as the build command
2. Verify the build output directory is `.open-next`
3. Check that `@opennextjs/cloudflare` is in your dependencies
4. Look for any specific error messages in the Cloudflare Pages build logs

For more information, see:
- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nextjs-site/)