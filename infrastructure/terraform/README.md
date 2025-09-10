# Terraform Infrastructure

## Resource Naming Convention

All resources follow the pattern: `journalai-dev-{resource}`

- ECR: `journalai-dev-backend`
- ECS Cluster: `journalai-dev-cluster`  
- ECS Service: `journalai-dev-service`
- Service Discovery Namespace: `journalai-dev.local`
- API Gateway: `journalai-dev-http-api`
- VPC Link: `journalai-dev-vpc-link`
- RDS: `journalai-dev-db`
- Security Groups: `journalai-dev-{ecs-tasks|apigw-vpc-link|rds}-sg`

## Deployment

The GitHub Actions workflow handles everything automatically:

1. **First deployment after infrastructure changes**: 
   - Destroys all existing resources (temporary job - remove after first run)
   - Imports any existing resources that match our naming convention
   - Creates/updates all resources via Terraform

2. **Regular deployments**:
   - Imports existing resources (idempotent - safe to run multiple times)
   - Updates infrastructure as needed via Terraform

## Manual Terraform Commands

If you need to run Terraform manually:

```bash
# Initialize
terraform init \
  -backend-config="bucket=YOUR_BUCKET" \
  -backend-config="key=YOUR_KEY" \
  -backend-config="region=YOUR_REGION"

# Import existing resources (safe to run anytime)
terraform import aws_ecr_repository.backend journalai-dev-backend
terraform import aws_ecs_cluster.this journalai-dev-cluster
terraform import aws_ecs_service.backend journalai-dev-cluster/journalai-dev-service
# ... (see CI/CD workflow for complete list)

# Apply changes
terraform apply
```

## Important Notes

- All resources are fully managed by Terraform
- The import commands in CI/CD are idempotent (safe to run multiple times)
- Service Discovery resources are created/managed automatically
- No manual AWS Console changes should be made