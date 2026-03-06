# Deployment Guide

## Docker (Local Development)

### Start everything

```bash
cd claude-mobile-app
docker compose up --build
```

This spins up three containers:

| Service  | URL                    | Description         |
|----------|------------------------|---------------------|
| Backend  | http://localhost:8080  | Spring Boot API     |
| Mailpit  | http://localhost:8025  | Email testing UI    |
| Postgres | localhost:5432         | PostgreSQL database |

The backend runs the `prod` Spring profile, connecting to PostgreSQL instead of H2. Mailpit catches all outgoing emails on SMTP port 1025. The backend waits for PostgreSQL's healthcheck to pass before starting, so ordering is automatic.

Then run the mobile app as usual:

```bash
cd mobile-app
npx expo start
```

### Useful commands

```bash
docker compose up -d --build    # run in background
docker compose logs -f backend  # tail backend logs
docker compose down             # stop everything
docker compose down -v          # stop + delete the database volume (fresh start)
```

### Build the image only

```bash
docker build -t mobileapp-backend ./backend
```

The Dockerfile uses a multi-stage build (Maven build + JRE-only runtime) and runs as a non-root user.

### Podman

The same commands work with Podman — use `podman compose up --build` if you have `podman-compose` or the Podman Docker-compatible CLI. The compose file uses standard syntax with nothing Docker-specific.

---

## Kubernetes

### Prerequisites

- A running Kubernetes cluster (minikube, kind, EKS, GKE, etc.)
- `kubectl` configured to connect to the cluster
- The backend Docker image available to the cluster (pushed to a registry, or loaded locally for minikube/kind)

### Deploy

```bash
# Create the namespace first
kubectl apply -f k8s/namespace.yml

# Then apply all manifests
kubectl apply -f k8s/
```

This creates the `mobileapp` namespace with:

| Resource                 | Kind        | Description                               |
|--------------------------|-------------|-------------------------------------------|
| `namespace.yml`          | Namespace   | `mobileapp` namespace                     |
| `configmap.yml`          | ConfigMap   | Non-sensitive config (DB host, mail, CORS) |
| `secret.yml`             | Secret      | DB credentials, JWT secret, admin password |
| `postgres.yml`           | StatefulSet | PostgreSQL 16 with 1Gi PVC                |
| `backend-deployment.yml` | Deployment  | Backend (2 replicas) with health probes    |
| `backend-service.yml`    | Service     | ClusterIP on port 80 → 8080               |
| `ingress.yml`            | Ingress     | nginx ingress routing `/` → backend        |

### Update secrets before deploying

The default `k8s/secret.yml` contains placeholder values. Replace them with real base64-encoded credentials:

```bash
echo -n 'your-real-db-password' | base64
echo -n 'your-real-admin-password' | base64
# For JWT secret, generate a strong random key:
openssl rand -base64 64 | base64
```

Then update the corresponding values in `k8s/secret.yml`.

### Loading the image (local clusters)

For **minikube**:

```bash
eval $(minikube docker-env)
docker build -t mobileapp-backend:latest ./backend
```

For **kind**:

```bash
docker build -t mobileapp-backend:latest ./backend
kind load docker-image mobileapp-backend:latest
```

For a **remote registry** (Docker Hub, ECR, GCR, etc.):

```bash
docker build -t your-registry/mobileapp-backend:latest ./backend
docker push your-registry/mobileapp-backend:latest
```

Then update the `image` field in `k8s/backend-deployment.yml` to match.

### Verify the deployment

```bash
# Check all resources in the namespace
kubectl get all -n mobileapp

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=backend -n mobileapp --timeout=120s

# Check backend logs
kubectl logs -l app=backend -n mobileapp -f

# Check health endpoint
kubectl port-forward svc/backend 8080:80 -n mobileapp
curl http://localhost:8080/actuator/health
```

### Ingress

The included `ingress.yml` uses the nginx ingress controller. If your cluster doesn't have one:

```bash
# For minikube
minikube addons enable ingress

# For other clusters, install the nginx ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### Tear down

```bash
kubectl delete -f k8s/
```

This removes all resources but preserves the PVC. To also delete stored data:

```bash
kubectl delete pvc -l app=postgres -n mobileapp
kubectl delete namespace mobileapp
```
