# Service Discovery namespace
# This will either be created new or use existing (via import)
resource "aws_service_discovery_private_dns_namespace" "this" {
  name        = "${var.project}-${var.environment}.local"
  description = "Private namespace for ${var.project} ${var.environment}"
  vpc         = data.aws_vpc.default.id

  # If namespace already exists with different settings, ignore changes
  lifecycle {
    ignore_changes = [description]
  }
}

# Service Discovery service
# This will either be created new or use existing (via import)
resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.this.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    # failure_threshold is deprecated and always set to 1 by AWS
  }

  # If service already exists, don't recreate
  lifecycle {
    create_before_destroy = false
  }
}

output "service_discovery_arn" {
  value       = aws_service_discovery_service.backend.arn
  description = "ARN of the service discovery service for backend"
}