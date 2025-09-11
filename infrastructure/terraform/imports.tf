# Terraform Import Blocks - Declarative Resource Imports
# This file handles importing existing AWS resources into Terraform state
# These import blocks are processed during terraform plan/apply
# They can be safely left in the configuration as documentation

# IMPORTANT: Import blocks require literal string values known at plan time
# They cannot use variables, locals, or dynamic expressions
# For resources with dynamic IDs (like API Gateway routes), we handle imports in CI/CD

# Since import blocks don't support conditionals, these will only work if the resources exist
# If they don't exist, Terraform will show an error during plan, which we handle in CI/CD

# Import ECR Repository if it exists
# The import will fail gracefully if the resource doesn't exist yet
import {
  to = aws_ecr_repository.backend
  id = "journalai-dev-backend"
}

# Import ECS Cluster if it exists
import {
  to = aws_ecs_cluster.this
  id = "journalai-dev-cluster"
}

# Import CloudWatch Log Group if it exists
import {
  to = aws_cloudwatch_log_group.ecs
  id = "/ecs/journalai-dev-service"
}

# Import IAM Role if it exists
import {
  to = aws_iam_role.ecs_task_execution_role
  id = "journalai-dev-ecsTaskExecutionRole"
}

# Import RDS Instance if it exists
import {
  to = aws_db_instance.postgres
  id = "journalai-dev-db"
}

# Import DB Subnet Group if it exists
import {
  to = aws_db_subnet_group.db
  id = "journalai-dev-db-subnets"
}

# For Security Groups - these use computed IDs so must be imported via CI/CD
# The security group IDs are not known until after they're queried from AWS

# For API Gateway resources - these also use dynamic IDs
# - aws_apigatewayv2_api.http_api
# - aws_apigatewayv2_vpc_link.this
# - aws_apigatewayv2_integration.backend
# - aws_apigatewayv2_route.root
# - aws_apigatewayv2_route.proxy
# - aws_apigatewayv2_stage.prod
# These must be imported via the CI/CD pipeline

# For Service Discovery resources - also dynamic
# - aws_service_discovery_private_dns_namespace.this
# - aws_service_discovery_service.backend
# These must be imported via the CI/CD pipeline