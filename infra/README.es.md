# Carpeta `infra`

Esta carpeta contiene las **configuraciones de infraestructura** para el monorepo (por ejemplo: Dockerfiles, scripts de Terraform, manifiestos de despliegue, configuraciones de Nginx, etc.).

- **Propósito principal**: centralizar la definición de la infraestructura necesaria para ejecutar las aplicaciones y servicios de la compañía.
- **Recomendación**: documenta cómo aprovisionar y desplegar la infraestructura.
- **Deploy automático**: los merges a `main` despliegan los servicios cambiados; ver [deploy/README.es.md](./deploy/README.es.md).
