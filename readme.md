# Development

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
