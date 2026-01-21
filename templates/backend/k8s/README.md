# Kubernetes Manifest Templates

Kubernetes manifests for deploying backend services.

## PostgreSQL Deployment

```yaml
# k8s/postgres.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: database
  labels:
    name: database

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: database
data:
  POSTGRES_DB: app_db
  POSTGRES_USER: app_user
  POSTGRES_PORT: "5432"

---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: database
type: Opaque
data:
  # Base64 encoded values - replace with actual values
  POSTGRES_PASSWORD: Y2hhbmdlLW1lLWluLXByb2R1Y3Rpb24=
  # Generate with: echo -n "your-password" | base64

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: database
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: database
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: postgres
          env:
            - name: POSTGRES_DB
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_DB
            - name: POSTGRES_USER
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
            - name: migrations
              mountPath: /migrations
              readOnly: true
          livenessProbe:
            exec:
              command:
                - sh
                - -c
                - pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command:
                - sh
                - -c
                - pg_isready -U $POSTGRES_USER -d $POSTGRES_DB
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: migrations
          configMap:
            name: migrations-cm
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: standard
        resources:
          requests:
            storage: 10Gi

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: database
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
      name: postgres
  selector:
    app: postgres

---
# PgBouncer for connection pooling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
  namespace: database
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
    spec:
      containers:
        - name: pgbouncer
          image: edoburu/pgbouncer:latest
          ports:
            - containerPort: 5432
          env:
            - name: DATABASES_HOST
              value: postgres.database.svc.cluster.local
            - name: DATABASES_PORT
              value: "5432"
            - name: DATABASES_USER
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_USER
            - name: DATABASES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: POSTGRES_PASSWORD
            - name: DATABASES_DBNAME
              valueFrom:
                configMapKeyRef:
                  name: postgres-config
                  key: POSTGRES_DB
            - name: POOL_MODE
              value: transaction
            - name: MAX_CLIENT_CONN
              value: "1000"
            - name: DEFAULT_POOL_SIZE
              value: "25"
            - name: MIN_POOL_SIZE
              value: "5"
          livenessProbe:
            tcpSocket:
              port: 5432
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            tcpSocket:
              port: 5432
            initialDelaySeconds: 5
            periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: pgbouncer
  namespace: database
spec:
  type: ClusterIP
  ports:
    - port: 5432
      targetPort: 5432
  selector:
    app: pgbouncer
```

## Redis Deployment

```yaml
# k8s/redis.yaml
---
apiVersion: v1
kind: Namespace
metadata:
  name: cache

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-config
  namespace: cache
data:
  redis.conf: |
    maxmemory 256mb
    maxmemory-policy allkeys-lru
    save 900 1
    save 300 10
    save 60 10000

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: cache
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          command:
            - redis-server
            - /etc/redis/redis.conf
          volumeMounts:
            - name: config
              mountPath: /etc/redis
              readOnly: true
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
      volumes:
        - name: config
          configMap:
            name: redis-config

---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: cache
spec:
  type: ClusterIP
  ports:
    - port: 6379
      targetPort: 6379
  selector:
    app: redis
```

## Fission Deployment

```yaml
# k8s/fission.yaml
---
# Fission namespace
apiVersion: v1
kind: Namespace
metadata:
  name: fission

---
# Fission ConfigMap for environment variables
apiVersion: v1
kind: ConfigMap
metadata:
  name: fission-config
  namespace: fission
data:
  DB_HOST: pgbouncer.database.svc.cluster.local
  DB_PORT: "5432"
  DB_NAME: app_db
  REDIS_HOST: redis.cache.svc.cluster.local
  REDIS_PORT: "6379"
  JWT_SECRET: "change-me-in-production"
  LOG_LEVEL: "info"

---
# Fission Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: fission-secret
  namespace: fission
type: Opaque
stringData:
  DB_USER: app_user
  DB_PASSWORD: your-db-password
  JWT_SECRET: your-jwt-secret-key
  API_KEYS: "key1,key2,key3"

---
# Node.js environment for Fission
apiVersion: fission.io/v1
kind: Environment
metadata:
  name: nodejs
  namespace: fission
spec:
  builder:
    command: build
    image: fission/node-builder-20:latest
  poolsize: 3
  keepalive: 60
  runtime:
    image: fission/node-runtime-20:latest
  version: 3

---
# Example function deployment (managed by fission CLI)
# This is for reference - actual functions are deployed via fission CLI
```

## Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pgbouncer-hpa
  namespace: database
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pgbouncer
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: redis-hpa
  namespace: cache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: redis
  minReplicas: 1
  maxReplicas: 3
  metrics:
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
```

## Network Policies

```yaml
# k8s/network-policies.yaml
---
# Allow database namespace to receive connections
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-ingress
  namespace: database
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: fission
      ports:
        - protocol: TCP
          port: 5432

---
# Allow cache namespace to receive connections
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: cache-ingress
  namespace: cache
spec:
  podSelector:
    matchLabels:
      app: redis
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: fission
      ports:
        - protocol: TCP
          port: 6379

---
# Default deny all for database namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: database
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

## Pod Disruption Budget

```yaml
# k8s/pdb.yaml
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: postgres-pdb
  namespace: database
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: postgres

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: pgbouncer-pdb
  namespace: database
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: pgbouncer

---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: redis-pdb
  namespace: cache
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: redis
```

## Service Monitor (for Prometheus)

```yaml
# k8s/servicemonitor.yaml
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: postgres-exporter
  namespace: database
  labels:
    app: postgres
spec:
  selector:
    matchLabels:
      app: postgres
  endpoints:
    - port: exporter
      interval: 30s
      path: /metrics

---
# Add postgres-exporter sidecar to StatefulSet
# (This would be added to the postgres StatefulSet)
```

## Deployment Script

```bash
#!/bin/bash
# scripts/deploy-k8s.sh

set -e

# Configuration
NAMESPACE=${1:-default}
K8S_DIR=$(dirname "$0")/../k8s

echo "Deploying to namespace: $NAMESPACE"

# Create namespaces
kubectl create namespace database --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace cache --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace fission --dry-run=client -o yaml | kubectl apply -f -

# Deploy database
echo "Deploying PostgreSQL..."
kubectl apply -f "$K8S_DIR/postgres.yaml"

# Deploy cache
echo "Deploying Redis..."
kubectl apply -f "$K8S_DIR/redis.yaml"

# Deploy Fission
echo "Deploying Fission..."
kubectl apply -f "$K8S_DIR/fission.yaml"

# Deploy network policies
echo "Deploying network policies..."
kubectl apply -f "$K8S_DIR/network-policies.yaml"

# Deploy PDBs
echo "Deploying PodDisruptionBudgets..."
kubectl apply -f "$K8S_DIR/pdb.yaml"

# Wait for pods to be ready
echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n database --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n cache --timeout=300s

echo "Deployment complete!"
echo ""
echo "Services:"
echo "  PostgreSQL: postgres.database.svc.cluster.local:5432"
echo "  PgBouncer:  pgbouncer.database.svc.cluster.local:5432"
echo "  Redis:      redis.cache.svc.cluster.local:6379"
```
