# Import blocks for existing resources
# These are idempotent - Terraform will only import if resource exists in AWS but not in state
# Import blocks can remain in configuration as historical artifacts per HashiCorp best practices

# ===========================
# Resources with Known Names
# ===========================

# ECR Repository - imported by name
import {
  to = aws_ecr_repository.backend
  id = "journalai-dev-backend"
}

# IAM Role - imported by name
import {
  to = aws_iam_role.ecs_task_execution_role
  id = "journalai-dev-ecsTaskExecutionRole"
}

# CloudWatch Log Group - imported by name
import {
  to = aws_cloudwatch_log_group.ecs
  id = "/ecs/journalai-dev-service"
}

# DB Subnet Group - imported by name
import {
  to = aws_db_subnet_group.db
  id = "journalai-dev-db-subnets"
}

# ECS Cluster - imported by name
import {
  to = aws_ecs_cluster.this
  id = "journalai-dev-cluster"
}

# ECS Service - imported by cluster/service format
import {
  to = aws_ecs_service.backend
  id = "journalai-dev-cluster/journalai-dev-service"
}

# RDS Instance - imported by identifier
import {
  to = aws_db_instance.postgres
  id = "journalai-dev-db"
}