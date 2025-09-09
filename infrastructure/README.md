Infrastructure: Dev ECS + NLB + VPC Link (HTTP API)

Overview
- Goal: a minimal, single‑container deployment for the backend on ECS Fargate, fronted by a Network Load Balancer (NLB) and exposed via API Gateway HTTP API using a VPC Link. No custom domain. Suitable for quick testing and TestFlight.
- CI/CD: GitHub Actions builds the image from `backend/Dockerfile`, pushes to ECR, then runs Terraform in `infrastructure/terraform` to create/update the NLB + target group, ECS cluster/service (Fargate), VPC Link, HTTP API, and sets environment variables from GitHub Secrets on pushes to the `dev` branch. No AWS CLI ad‑hoc provisioning.

Key Resources
- ECR repository: stores the container image.
- ECS Fargate service: runs your FastAPI container (1 task). Public IP enabled for simple outbound internet to OpenAI.
- Network Load Balancer: internet‑facing TCP:80 to target group port 8000.
- API Gateway HTTP API: public HTTPS endpoint with VPC Link integration to the NLB.

Important Notes
- Database/Redis/Celery: The ECS task includes Postgres and Redis containers alongside the API, plus Celery worker and beat. This keeps everything in a single cheap task for beta. Data is ephemeral (task restarts will wipe Postgres data). When ready, move DB to RDS and Redis to ElastiCache, and split workers.
- Security groups: Tasks allow inbound 8000 from the VPC CIDR (so NLB can reach them). Tasks get a public IP for outbound to the internet.

Required GitHub Secrets (used by Terraform via TF_VAR_*)
 - Minimal required to run:
   - `AWS_REGION`: Deployment region (e.g., `us-east-1`).
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: CI role credentials with permissions for ECR, ECS, ELBv2, APIGW, IAM, Logs.
   - `SECRET_KEY`
   - `OPENAI_API_KEY`
 - Optional (override default names, otherwise they auto‑generate as `journalai-dev-*`):
   - `ECR_REPO`, `ECS_CLUSTER`, `ECS_SERVICE`, `API_NAME`, `NLB_NAME`, `TG_NAME`, `VPC_LINK_NAME`
 - App envs passed to the container (adjust as needed; sensible defaults already set):
  - `ENVIRONMENT` (e.g., `development`)
  - `SECRET_KEY`
  - `OPENAI_API_KEY`
  - `DATABASE_URL` (defaults to in‑task Postgres: `postgresql://journalai:journalai@127.0.0.1:5432/journalai`)
  - `REDIS_URL` (defaults to `redis://127.0.0.1:6379/0`)

Optional: Remote Terraform backend
- If you have an S3 bucket + DynamoDB table for state/locking, set these secrets to use a remote backend during `terraform init`:
  - `TF_BACKEND_BUCKET`, `TF_BACKEND_DYNAMODB_TABLE`, `TF_BACKEND_REGION`, and `TF_BACKEND_KEY` (e.g., `journalai/dev/terraform.tfstate`).
  - If not provided, the workflow falls back to a local backend (ephemeral state per run).
- App envs passed to the container (adjust as needed):
  - `ENVIRONMENT` (e.g., `development`)
  - `SECRET_KEY`
  - `OPENAI_API_KEY`
  - `DATABASE_URL` (e.g., `sqlite:////tmp/journalai.db`)
  - `REDIS_URL` (optional; unused without Celery)

What the Workflow Does
1) terraform init (optionally using an S3 backend if configured by secrets).
2) terraform apply -target=aws_ecr_repository.backend (ensures ECR repo exists, named automatically as `journalai-dev-backend` unless overridden).
3) Build and push image to ECR (tags: commit SHA and `dev-latest`) using Terraform output for the repo URL.
4) terraform apply (creates/updates ECS cluster/service, NLB+TG+listener, API Gateway HTTP API + VPC Link + routes). Names default to `journalai-dev-*` unless overridden.
5) Prints the API endpoint output.

Local Build/Smoke Test (optional)
- `docker build -t journalai-backend:dev backend && docker run -p 8000:8000 journalai-backend:dev`
- Visit `http://localhost:8000/health`.

Next Steps (When you want more)
- Persistence: move DB to RDS and update `DATABASE_URL`.
- Background jobs: add Redis/ElastiCache and a Celery worker/beat (ECS).
- Tighten security groups and place tasks in private subnets with NAT if you need outbound internet without public IPs.
