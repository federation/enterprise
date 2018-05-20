# Enterprise

[![Build Status](https://travis-ci.com/federation/enterprise.svg?branch=master)](https://travis-ci.com/federation/enterprise) [![codecov](https://codecov.io/gh/federation/enterprise/branch/master/graph/badge.svg)](https://codecov.io/gh/federation/enterprise) [![Docker Pulls](https://img.shields.io/docker/pulls/fedtech/enterprise.svg)](https://hub.docker.com/r/fedtech/enterprise/)

## Development

### Docker Compose

Create a `.env` file at the root with these definitions:

| Name                  | Value                    |
| :--                   | :--                      |
| `ENTERPRISE_WEB_PATH` | path to [enterprise-web] |

[enterprise-web]: https://github.com/federation/enterprise-web

Careful with relative paths when running docker as root.

Run `docker-compose up --build` to initiate each necessary service.

Access the service through http://localhost:8000

#### Utility Scripts

There are utility scripts in `docker/scripts/`.

| Script         | Purpose                      |
| :--            | :--                          |
| `psql.sh`      | initiate a psql session      |
| `redis-cli.sh` | initiate a redis-cli session |

### Kubernetes

These tools are required to develop on locally on kubernetes:

* [docker](https://www.docker.com/)
* [kubectl](https://github.com/kubernetes/kubectl)
* [minikube](https://github.com/kubernetes/minikube)
* [helm](https://helm.sh/)
* [skaffold](https://github.com/GoogleContainerTools/skaffold)

The general flow is:

``` shell
# Create a minikube cluster.
$ minikube start

# Use minikube's docker environment.
$ eval $(minikube docker-env)

# Watch for changes.
# When detected, rebuild image and redeploy.
$ skaffold dev

# Open a browser to the service endpoint.
# Pass --url to only get the url.
$ minikube service enterprise
```
