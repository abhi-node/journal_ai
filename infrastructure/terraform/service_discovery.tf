# Service Discovery - Create or use existing
data "aws_service_discovery_http_namespace" "existing" {
  count = var.use_existing_namespace ? 1 : 0
  name  = "${var.project}-${var.environment}.local"
}

resource "aws_service_discovery_private_dns_namespace" "this" {
  count       = var.use_existing_namespace ? 0 : 1
  name        = "${var.project}-${var.environment}.local"
  description = "Private namespace for ${var.project} ${var.environment}"
  vpc         = data.aws_vpc.default.id
}

locals {
  namespace_id = var.use_existing_namespace ? data.aws_service_discovery_http_namespace.existing[0].id : aws_service_discovery_private_dns_namespace.this[0].id
}

resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = local.namespace_id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  # Don't specify health_check_custom_config at all for ECS-managed services
  # ECS handles health checks automatically
  
  lifecycle {
    create_before_destroy = true
  }
}

output "service_discovery_arn" {
  value       = aws_service_discovery_service.backend.arn
  description = "ARN of the service discovery service for backend"
}