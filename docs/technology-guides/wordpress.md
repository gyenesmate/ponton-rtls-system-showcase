# WordPress

The plugin root is `wordpress/`. Its PHP files register assets and shortcodes,
sanitize attributes, and output a mount container. Simulation, rendering, and
scenario behavior stay in TypeScript.

Keep PHP compatible with PHP 7.4. Sanitize input, escape output, and use the
scenario allowlist in `wordpress/includes/class-rtls-showcase.php`.

Vite assets are ES modules with stable filenames under `wordpress/dist/`.
Generate that directory with `npm run package:plugin`; do not edit generated
assets by hand. See [deployment](../deployment/wordpress.md) for the zip flow.
