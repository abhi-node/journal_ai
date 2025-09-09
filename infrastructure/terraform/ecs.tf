resource "aws_ecs_cluster" "this" {
  name = local.ecs_cluster_name
}

locals {
  repository_url = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${aws_ecr_repository.backend.name}"
  image_uri      = "${local.repository_url}:${var.image_tag}"
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
          value = var.database_url
        },
        {
          name  = "REDIS_URL"
          value = var.redis_url
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
    },
    {
      name      = "postgres"
      image     = "postgres:15-alpine"
      essential = true
      environment = [
        {
          name  = "POSTGRES_USER"
          value = "journalai"
        },
        {
          name  = "POSTGRES_PASSWORD"
          value = "journalai"
        },
        {
          name  = "POSTGRES_DB"
          value = "journalai"
        }
      ]
      portMappings = [
        {
          containerPort = 5432
          protocol      = "tcp"
        }
      ]
      healthCheck = {
        command  = ["CMD-SHELL", "pg_isready -U journalai -h 127.0.0.1"]
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
          value = var.database_url
        },
        {
          name  = "REDIS_URL"
          value = var.redis_url
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
        },
        {
          containerName = "postgres"
          condition     = "START"
        }
      ]
    },
    {
      name      = "celery_beat"
      image     = local.image_uri
      essential = false
      command   = ["sh", "-c", "celery -A app.core.celery_app beat --loglevel=info"]
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
          value = var.database_url
        },
        {
          name  = "REDIS_URL"
          value = var.redis_url
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
        },
        {
          containerName = "celery_worker"
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
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}
