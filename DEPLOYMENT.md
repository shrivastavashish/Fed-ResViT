# Deployment

## Existing public application

https://fed-resvit-research.shriashish1920.chatgpt.site/

This publication is managed separately from your own Cloudflare account.

## Independent Cloudflare Workers deployment from GitHub

The repository includes an independent build mode, which excludes the Sites development integration. It uses the same application and evidence. No GPU is needed for this research explorer. The optional Python API and live ML inference are not deployed by this procedure.

In the Cloudflare dashboard, open **Workers & Pages → Create application → Import a repository**. Connect your GitHub account and select **shrivastavashish/Fed-ResViT**.

Use these settings:

- Worker name: `fed-resvit` (must match `wrangler.cloudflare.jsonc`).
- Production branch: `main`.
- Root directory: repository root.
- Build command: `npm run build:cloudflare`.
- Deploy command: `npm run deploy:cloudflare`.
- Node version: 22.16.0 or a newer supported Node 22 release (set `NODE_VERSION` in build variables if required).

Cloudflare installs dependencies using the committed package lock. Authorize only the intended repository. The first successful build creates a `workers.dev` URL in your account; subsequent pushes to `main` trigger a new build. No custom domain is required.

Do not use Cloudflare Pages or upload the source folder as static files: this application has a Worker server entrypoint.

### Local deployment alternative

```sh
npm ci
npx wrangler login
npm run build:cloudflare
npm run deploy:cloudflare
```

If multiple Cloudflare accounts are available, select the intended account or set `CLOUDFLARE_ACCOUNT_ID` in your shell. Keep credentials out of the repository. Dashboard Git integration is configured separately from local CLI login.

### Verification

Open the returned URL and `/api/health`. Check the About page, mentor photo and downloadable evidence. A successful deployment does not add a model checkpoint or enable training/inference services.

References:
- https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
