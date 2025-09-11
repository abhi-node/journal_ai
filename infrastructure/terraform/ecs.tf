resource "aws_ecs_cluster" "this" {
  name = local.ecs_cluster_name
}

locals {
  repository_url    = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${aws_ecr_repository.backend.name}"
  image_uri         = "${local.repository_url}:${var.image_tag}"
  database_password = var.db_password != "" ? var.db_password : random_password.db.result
  database_url      = "postgresql://${var.db_username}:${local.database_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}"
  redis_url         = var.redis_url != "" ? var.redis_url : "redis://127.0.0.1:6379/0"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project}-${var.environment}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = local.image_uri
      essential = true
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      command = [
        "sh",
        "-c",
        "alembic -c alembic.ini upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"
      ]
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "SECRET_KEY"
          value = var.secret_key
        },
        {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        },
        {
          name  = "DATABASE_URL"
          value = local.database_url
        },
        {
          name  = "REDIS_URL"
          value = local.redis_url
        },
        {
          name  = "PYTHONPATH"
          value = "/app"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://127.0.0.1:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 40
      }
      dependsOn = [
        {
          containerName = "redis"
          condition     = "START"
        }
      ]
    },
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = true
      portMappings = [
        {
          containerPort = 6379
          protocol      = "tcp"
        }
      ]
      healthCheck = {
        command  = ["CMD", "redis-cli", "ping"]
        interval = 30
        timeout  = 5
        retries  = 3
      }
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    },
    {
      name      = "celery_worker"
      image     = local.image_uri
      essential = false
      command   = ["sh", "-c", "celery -A app.core.celery_app worker --loglevel=info --concurrency=1"]
      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "SECRET_KEY"
          value = var.secret_key
        },
        {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        },
        {
          name  = "DATABASE_URL"
          value = local.database_url
        },
        {
          name  = "REDIS_URL"
          value = local.redis_url
        },
        {
          name  = "PYTHONPATH"
          value = "/app"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
      dependsOn = [
        {
          containerName = "redis"
          condition     = "START"
        }
      ]
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = local.ecs_service_name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.vpc_link_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  service_registries {
    registry_arn   = aws_service_discovery_service.backend.arn
    container_name = "backend"
    container_port = 8000
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}
