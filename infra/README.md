# `infra` folder

This folder contains **infrastructure configurations** for the monorepo (for example: Dockerfiles, Terraform scripts, deployment manifests, Nginx configs, etc.).

- **Main purpose**: to centralize the definition of the infrastructure required to run the company's applications and services.
- **Recommendation**: document how to provision and deploy the infrastructure.
- **Automatic deploy**: merges to `main` deploy changed services; see [deploy/README.md](./deploy/README.md).

> _Spanish version: [README.es.md](./README.es.md)._
