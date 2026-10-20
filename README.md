# Novextech

The application source is in `novextech-liara-deploy-20261020-215456/`. The repository root includes the Liara Docker entry point and persistent-disk configuration.

## Deploy to Liara

1. Create a Docker app and connect this GitHub repository, using the repository root as the build context.
2. Attach a persistent disk at `/data`. SQLite is configured at `/data/novextech.sqlite`; run one app instance.
3. Configure production variables from `.env.example`. Set real secrets only in Liara's environment settings, never in GitHub.
4. Read [the deployment guide](./novextech-liara-deploy-20261020-215456/docs/LIARA-DEPLOYMENT.md) before first boot.

GitHub Actions runs the app's tests and production build on pushes and pull requests.
