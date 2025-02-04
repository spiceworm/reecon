terraform {
  required_version = ">= 1.10.5"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = ">= 2.48.2"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}
