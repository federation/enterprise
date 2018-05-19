# Enterprise

[![Build Status](https://travis-ci.com/federation/enterprise.svg?branch=master)](https://travis-ci.com/federation/enterprise) [![codecov](https://codecov.io/gh/federation/enterprise/branch/master/graph/badge.svg)](https://codecov.io/gh/federation/enterprise) [![Docker Pulls](https://img.shields.io/docker/pulls/fedtech/enterprise.svg)](https://hub.docker.com/r/fedtech/enterprise/)

## Development

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

## Dependencies

* docker
* kubectl
* minikube
* helm
* skaffold
