locals {
    a_records = {
        "172.66.0.96"    = "@"
        "162.159.140.98" = "@"
    }
    aaaa_records = {
        "2606:4700:7::60"  = "@"
        "2a06:98c1:58::60" = "@"
    }
    cname_records = {
        "protonmail._domainkey"  = "protonmail.domainkey.${var.dns_dkim}.domains.proton.ch."
        "protonmail2._domainkey" = "protonmail2.domainkey.${var.dns_dkim}.domains.proton.ch."
        "protonmail3._domainkey" = "protonmail3.domainkey.${var.dns_dkim}.domains.proton.ch."
    }
    mx_records = {
        "mail.protonmail.ch."    = 10
        "mailsec.protonmail.ch." = 20
    }
    ns_records = {
        "ns1.digitalocean.com." = "@"
        "ns2.digitalocean.com." = "@"
        "ns3.digitalocean.com." = "@"
    }
    txt_records = {
        "v=spf1 include:_spf.protonmail.ch ~all"          = "@"
        "v=DMARC1; p=quarantine"                          = "_dmarc"
        "protonmail-verification=${var.dns_verification}" = "@"
    }
}

resource "digitalocean_domain" "reecon" {
    name = "reecon.xyz"
}

resource "digitalocean_record" "A" {
    for_each = local.a_records
    domain   = digitalocean_domain.reecon.id
    ttl      = 30
    type     = "A"
    name     = each.value
    value    = each.key
}

resource "digitalocean_record" "AAAA" {
    for_each = local.aaaa_records
    domain   = digitalocean_domain.reecon.id
    ttl      = 30
    type     = "AAAA"
    name     = each.value
    value    = each.key
}

resource "digitalocean_record" "CNAME" {
    for_each = local.cname_records
    domain   = digitalocean_domain.reecon.id
    ttl      = 43200
    type     = "CNAME"
    name     = each.key
    value    = each.value
}

resource "digitalocean_record" "MX" {
    for_each = local.mx_records
    domain   = digitalocean_domain.reecon.id
    ttl      = 3600
    type     = "MX"
    name     = "@"
    priority = each.value
    value    = each.key
}

resource "digitalocean_record" "NS" {
    for_each = local.ns_records
    domain   = digitalocean_domain.reecon.id
    ttl      = 1800
    type     = "NS"
    name     = each.value
    value    = each.key
}

resource "digitalocean_record" "TXT" {
    for_each = local.txt_records
    domain   = digitalocean_domain.reecon.id
    ttl      = 3600
    type     = "TXT"
    name     = each.value
    value    = each.key
}

resource "digitalocean_database_firewall" "reecon-postgres-firewall" {
    cluster_id = digitalocean_database_cluster.reecon-postgres-cluster.id

    rule {
        type  = "app"
        value = digitalocean_app.reecon-app.id
    }
}

resource "digitalocean_database_firewall" "reecon-redis-firewall" {
    cluster_id = digitalocean_database_cluster.reecon-redis-cluster.id

    rule {
        type  = "app"
        value = digitalocean_app.reecon-app.id
    }
}
