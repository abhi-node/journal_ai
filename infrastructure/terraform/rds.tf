resource "random_password" "db" {
  length  = 24
  special = true
}

locals {
  db_identifier         = "${local.name_prefix}-db"
  db_name_effective     = var.db_name
  db_username_effective = var.db_username
  db_password_effective = var.db_password != "" ? var.db_password : random_password.db.result
}

resource "aws_db_subnet_group" "db" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
}

resource "aws_security_group" "rds" {
  name        = "${var.project}-${var.environment}-rds-sg"
  description = "Security group for RDS Postgres"
  vpc_id      = data.aws_vpc.default.id

  # Allow ECS tasks to connect to Postgres
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "Allow ECS tasks to connect to Postgres"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier                 = local.db_identifier
  engine                     = "postgres"
  engine_version             = var.db_engine_version
  instance_class             = var.db_instance_class
  db_name                    = local.db_name_effective
  username                   = local.db_username_effective
  password                   = local.db_password_effective
  allocated_storage          = var.db_allocated_storage
  storage_type               = "gp3"
  skip_final_snapshot        = true
  deletion_protection        = false
  auto_minor_version_upgrade = true
  apply_immediately          = true
  multi_az                   = false
  publicly_accessible        = var.db_publicly_accessible
  db_subnet_group_name       = aws_db_subnet_group.db.name
  vpc_security_group_ids     = [aws_security_group.rds.id]
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}
