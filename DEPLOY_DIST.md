# Deploy Through `dist` Only

Use only the prebuilt `dist` folder for upload.

## Build ready-to-upload `dist`

```bash
npm run dist:ready
```

`dist/` will contain:

- `index.html`
- `assets/*`
- `.htaccess` (for Apache/shared hosting)
- `auth/send-password-reset.php` (email recovery via PHP `mail()`)
- `auth/portal-store.php` (shared client portal data for registrations, projects, and chat)

## GPT chat configuration (optional)

To enable GPT in chat widget before build:

```bash
cp .env.example .env.local
```

Then set one of:

- `VITE_OPENAI_API_KEY=...` (quick setup, key is bundled into frontend)
- `VITE_OPENAI_API_PROXY_URL=https://your-domain.ru/api/support-chat` (recommended)

## Optional archive

```bash
npm run dist:zip
```

This creates `dist.tar.gz` from `dist/`.

## What to upload

Upload the **contents** of `dist/` (or unpack `dist.tar.gz`) into your host web root.

## Password recovery

The `forgot password` flow uses `auth/send-password-reset.php` from `dist/`.
For production this requires:

- PHP enabled on the host
- working PHP `mail()` delivery on the domain

## Shared client portal

Registrations, projects, and portal chat sync through `auth/portal-store.php`.
The handler stores data outside the uploaded `docs/` folder by default when the public web root is a typical shared-hosting directory like `docs`, `public_html`, `httpdocs`, or `www`:

- `/home/<account>/webstudio.ru/portal-data/portal-store.json` on the Nichost layout
- or the path from `DUALSTACK_PORTAL_STORAGE_DIR`, if that environment variable is set

The PHP user must be allowed to create and write that folder.

## Quick production health check

Open:

```text
https://your-domain/auth/portal-store.php
```

Expected response:

```json
{"ok":true,"store":{"currentUser":null,"clients":[]},"updatedAt":null}
```

If the URL returns HTML, a download prompt, or HTTP 500, the portal backend is not ready and login/registration will not work.
