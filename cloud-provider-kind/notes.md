Alternative to metallb/ — don't run both against the same cluster at once, they'll
race to set the LoadBalancer status on the same Services.

cloud-provider-kind is a controller that runs *outside* the cluster (talks to the
docker socket + each `kind-*` kubeconfig context directly), watches for
`type: LoadBalancer` Services across every kind cluster on the host, and spins up
a small docker container per service that proxies to it — giving each one a real
IP reachable from the host. No IP pool to plan (unlike MetalLB), no manifests to
apply to the cluster.

Install (Go toolchain is already on this host: go1.25.6 darwin/arm64):

```
go install sigs.k8s.io/cloud-provider-kind@latest
```

Binary lands in `$(go env GOPATH)/bin/cloud-provider-kind` — make sure that's on
$PATH (`export PATH="$(go env GOPATH)/bin:$PATH"`).

Run it (needs the docker socket; keep it running in a dedicated terminal/tmux pane,
or background it with nohup — it's a long-lived controller, not a one-shot):

```
cloud-provider-kind
```

Test with a LoadBalancer service — EXTERNAL-IP should populate within a few seconds:

```
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=LoadBalancer
kubectl get svc nginx -w
```

Clean up the test:

```
kubectl delete svc,deploy nginx
```

To run as a background docker container instead of a foreground host process
(avoids needing Go on the host, restart-friendly):

```
docker run -d --name cloud-provider-kind --restart unless-stopped \
  --network kind \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ~/.kube:/root/.kube \
  registry.k8s.io/cloud-provider-kind/cloud-provider-kind:v0.6.0
```
