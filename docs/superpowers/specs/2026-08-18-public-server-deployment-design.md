# Public Server Deployment Design

## Goal

Deploy the current Vue/Vite storefront to `49.235.130.42` so it is reachable over public HTTP while continuing to use the backend service exposed on port `8080` of the same server.

## Constraints

- Connect as `root` over SSH port `22` with the user-provided private key.
- Build from the current checked-out source rather than trusting the existing ignored `dist/` directory.
- Do not place the SSH private key in the repository or on the remote server.
- Serve the compiled frontend as static files through the server's existing Baota-managed Apache 2.4 instance.
- Proxy browser requests under `/api/` to `http://127.0.0.1:8080`.
- Support Vue Router history URLs by falling back to `/index.html`.
- Preserve the existing 114 MB document-root contents, including `/admin`, downloads, APKs, images, and named legacy pages; replace only the root application entry point and add the new hashed asset directory.
- Verify both the frontend document and a proxied API response from outside the server.

## Deployment Layout

- Release archive and rollback backup: `/www/backup/jd-mall-frontend/<release-id>/`
- Existing document root: `/www/projects/webs/html`
- Apache virtual-host configuration: `/www/server/panel/vhost/apache/html_49.235.130.42.conf`
- Vue history fallback: `/www/projects/webs/html/.htaccess`
- Public address: `http://49.235.130.42/`

## Rollback

Restore `index.html`, `.htaccess`, and the Apache virtual-host file from the timestamped backup, validate Apache configuration, then gracefully reload Apache. New hashed assets may remain because they do not change legacy files or the restored entry point.
