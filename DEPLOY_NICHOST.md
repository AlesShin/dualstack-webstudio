# Deploy to Nichost

## One-time requirements

- `npm install`
- SSH access to `ssh.ale7551132.nichost.ru`

## GPT support chat (optional)

Before deploy, configure `.env.local` from `.env.example` and set:

- `VITE_OPENAI_API_KEY` for direct GPT calls from browser, or
- `VITE_OPENAI_API_PROXY_URL` for secure server-side proxy (recommended).

## Password recovery by email

The forgot-password flow is handled by `dist/auth/send-password-reset.php`.
For it to work in production, the host must support:

- PHP execution
- PHP `mail()` on the domain

## Shared client portal

Client registrations, projects, and chat messages are handled by `dist/auth/portal-store.php`.
On Nichost with the standard `/docs` web root, it writes by default to
`/home/ale7551132/webstudio.ru/portal-data/portal-store.json`,
which keeps the shared data outside the public `docs/` folder. Make sure PHP can create and write that directory.

## Fast deploy

```bash
npm run deploy:nichost
```

## Deploy only from existing dist/

If `dist/` is already built and you want upload only that folder:

```bash
SKIP_BUILD=1 npm run deploy:nichost
```

The script will:

1. Build the app (`npm run build:host`)
2. Copy Apache config (`hosting/.htaccess`) into `dist/.htaccess`
3. Create the shared `portal-data/` directory on the server if it does not exist yet
4. Clean old `index.html`, `.htaccess`, and `assets/*` in `/home/ale7551132/webstudio.ru/docs`
5. Upload fresh files from `dist/`, including `.htaccess`

## Optional custom target

You can override target host/user/path:

```bash
HOST=ssh.ale7551132.nichost.ru \
USER_NAME=ale7551132 \
SSH_PORT=22 \
REMOTE_PATH=/home/ale7551132/webstudio.ru/docs \
npm run deploy:nichost
```

## Quick production health check

After deploy, open:

```text
https://your-domain/auth/portal-store.php
```

The handler should answer with JSON similar to:

```json
{"ok":true,"store":{"currentUser":null,"clients":[]},"updatedAt":null}
```

If you get `500`, HTML, or a file download instead of JSON, PHP or the storage directory is not configured correctly yet.
