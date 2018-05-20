# Enterprise

[![Build Status](https://travis-ci.com/federation/enterprise.svg?branch=master)](https://travis-ci.com/federation/enterprise) [![codecov](https://codecov.io/gh/federation/enterprise/branch/master/graph/badge.svg)](https://codecov.io/gh/federation/enterprise) [![Docker Pulls](https://img.shields.io/docker/pulls/fedtech/enterprise.svg)](https://hub.docker.com/r/fedtech/enterprise/)

## Development

### Docker Compose

Simply run `docker-compose up` to initiate each necessary service.

The `scripts/psql.sh` script initiates a psql connection to the PostgreSQL database.

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
