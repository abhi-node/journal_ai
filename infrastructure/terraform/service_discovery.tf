# Use existing namespace instead of creating a new one
data "aws_service_discovery_dns_namespace" "this" {
  name = "${var.project}-${var.environment}.local"
  type = "DNS_PRIVATE"
}

resource "aws_service_discovery_service" "backend" {
  name = "backend"

  dns_config {
    namespace_id = data.aws_service_discovery_dns_namespace.this.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    # failure_threshold is deprecated and always set to 1 by AWS
  }
}

output "service_discovery_arn" {
  value       = aws_service_discovery_service.backend.arn
  description = "ARN of the service discovery service for backend"
}