resource "digitalocean_database_db" "reecon-postgres-database" {
  cluster_id = digitalocean_database_cluster.reecon-postgres-cluster.id
  name       = "reecon"
}

resource "digitalocean_database_cluster" "reecon-postgres-cluster" {
    engine           = "pg"
    name             = "reecon-postgres-cluster"
    node_count       = 1
    region           = "nyc3"
    size             = "db-s-1vcpu-1gb"
    storage_size_mib = "10240"
    version          = "16"
}

resource "digitalocean_database_connection_pool" "reecon-postgres-pool" {
    cluster_id = digitalocean_database_cluster.reecon-postgres-cluster.id
    name       = "reecon-postgres-pool"
    mode       = "transaction"
    size       = 10
    db_name    = var.reecon_postgres_pool_db_name
    user       = var.reecon_postgres_pool_user
}

resource "digitalocean_database_cluster" "reecon-redis-cluster" {
    engine          = "redis"
    eviction_policy = "allkeys_lru"
    name            = "reecon-redis-cluster"
    node_count      = 1
    region          = "nyc3"
    size            = "db-s-1vcpu-1gb"
    version         = "7"
}
