1. Install MetalLB (upstream manifest, not vendored — check for a newer tag at
   https://github.com/metallb/metallb/releases before applying):

```
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml
kubectl wait --namespace metallb-system \
  --for=condition=ready pod \
  --selector=app=metallb \
  --timeout=90s
```

2. Apply the address pool + L2 advertisement for this cluster's docker network:

```
kubectl apply -f metallb/address-pool.yaml
```

3. Test with a LoadBalancer service — EXTERNAL-IP should move from <pending> to an
   address in 172.18.255.200-250 within a few seconds:

```
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=LoadBalancer
kubectl get svc nginx -w
```

Reachable from the host since the range is inside the kind docker network kubectl/docker
already route to. Clean up the test:

```
kubectl delete svc,deploy nginx
```
