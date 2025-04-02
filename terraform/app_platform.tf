resource "digitalocean_project" "reecon" {
    name        = "reecon"
    description = "Annotated reddit browsing and analysis"
    environment = "Production"
    purpose     = "Web Application"
    resources = [
        digitalocean_domain.reecon.urn, digitalocean_app.reecon-app.urn,
        digitalocean_database_cluster.reecon-postgres-cluster.urn,
        digitalocean_database_cluster.reecon-redis-cluster.urn
    ]
}

resource "digitalocean_app" "reecon-app" {
    spec {
        features = [
            "buildpack-stack=ubuntu-22",
        ]
        name   = "reecon-app"
        region = "nyc"

        alert {
            disabled = false
            rule     = "DEPLOYMENT_FAILED"
        }
        alert {
            disabled = false
            rule     = "DOMAIN_FAILED"
        }

        domain {
            name = "reecon.xyz"
        }

        env {
            key   = "ADMIN_PASSWORD"
            value = var.admin_password
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "APP_NAME"
            value = "reecon"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "DEFAULT_OPENAI_API_KEY"
            value = var.default_open_ai_api_key
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "LOG_LEVEL"
            value = "INFO"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "POSTGRES_DB"
            value = digitalocean_database_connection_pool.reecon-postgres-pool.name
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "POSTGRES_HOST"
            value = digitalocean_database_cluster.reecon-postgres-cluster.host
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "POSTGRES_PASSWORD"
            value = digitalocean_database_cluster.reecon-postgres-cluster.password
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "POSTGRES_PORT"
            value = digitalocean_database_connection_pool.reecon-postgres-pool.port
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "POSTGRES_SSL"
            value = "require"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "POSTGRES_USER"
            value = digitalocean_database_cluster.reecon-postgres-cluster.user
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "PRODUCTION"
            value = "True"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDIS_HOST"
            value = digitalocean_database_cluster.reecon-redis-cluster.host
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDIS_PASSWORD"
            value = digitalocean_database_cluster.reecon-redis-cluster.password
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDIS_PORT"
            value = digitalocean_database_cluster.reecon-redis-cluster.port
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDIS_SSL"
            value = "True"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDIS_USERNAME"
            value = digitalocean_database_cluster.reecon-redis-cluster.user
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_API_CLIENT_ID"
            value = var.reddit_api_client_id
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_API_CLIENT_SECRET"
            value = var.reddit_api_client_secret
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_API_USER_AGENT"
            value = "reecon by /u/reecon-admin github.com/spiceworm/reecon"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_BOT_CLIENT_ID"
            value = var.reddit_bot_client_id
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_BOT_CLIENT_SECRET"
            value = var.reddit_bot_client_secret
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_BOT_PASSWORD"
            value = var.reddit_bot_password
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_BOT_USER_AGENT"
            value = "reecon-admin bot by /u/reecon-admin github.com/spiceworm/reecon"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "REDDIT_BOT_USERNAME"
            value = "reecon-admin"
            scope = "RUN_AND_BUILD_TIME"
        }
        env {
            key   = "SECRET_KEY"
            value = var.secret_key
            scope = "RUN_AND_BUILD_TIME"
        }

        ingress {
            rule {
                component {
                    name                 = "reecon-server"
                    preserve_path_prefix = false
                }
                match {
                    path {
                        prefix = "/"
                    }
                }
            }
        }

        service {
            http_port          = 80
            instance_count     = 1
            instance_size_slug = "apps-d-2vcpu-8gb"
            name               = "reecon-server"

            image {
                registry_type = "DOCR"
                repository    = "reecon/server"
                tag           = var.server_version

                deploy_on_push {
                    enabled = true
                }
            }
        }

        worker {
            instance_size_slug = "apps-d-2vcpu-4gb"
            name               = "reecon-worker"

            autoscaling {
                max_instance_count = 2
                min_instance_count = 1

                metrics {
                    cpu {
                        percent = 70
                    }
                }
            }

            image {
                registry_type = "DOCR"
                repository    = "reecon/worker"
                tag           = var.worker_version

                deploy_on_push {
                    enabled = true
                }
            }
        }
        worker {
            instance_count     = 1
            instance_size_slug = "apps-d-1vcpu-4gb"
            name               = "reecon-service"

            image {
                registry_type = "DOCR"
                repository    = "reecon/service"
                tag           = var.service_version

                deploy_on_push {
                    enabled = true
                }
            }
        }
    }
}
