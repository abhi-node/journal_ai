resource "aws_lb" "nlb" {
  name                             = local.nlb_name
  load_balancer_type               = "network"
  internal                         = false
  subnets                          = local.vpc_link_subnets
  enable_cross_zone_load_balancing = true
}

resource "aws_lb_target_group" "backend" {
  name        = local.tg_name
  port        = 8000
  protocol    = "TCP"
  target_type = "ip"
  vpc_id      = data.aws_vpc.default.id

  health_check {
    enabled             = true
    protocol            = "HTTP"
    port                = "8000"
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 10
    timeout             = 5
    matcher             = "200-399"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.nlb.arn
  port              = 80
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

output "nlb_dns_name" {
  value = aws_lb.nlb.dns_name
}
