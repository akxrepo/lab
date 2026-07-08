# K3s Installation with Multus CNI

This guide covers installing K3s, deploying Multus CNI with Whereabouts IPAM, configuring CNI plugins, and uninstalling K3s.

## Table of Contents

- [1. Install K3s](#1-install-k3s)
- [2. Configure kubectl](#2-configure-kubectl)
- [3. Install Multus CNI](#3-install-multus-cni)
- [4. Install Whereabouts IPAM](#4-install-whereabouts-ipam)
- [5. Install CNI Plugins](#5-install-cni-plugins)
- [6. Patch Multus DaemonSet](#6-patch-multus-daemonset)
- [7. Uninstall K3s](#7-uninstall-k3s)

---

## 1. Install K3s

```bash
curl -sfL https://get.k3s.io | sh -
```

## 2. Configure kubectl

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
kubectl get nodes
```

> **Tip:** Add `export KUBECONFIG=~/.kube/config` to your `~/.bashrc` or `~/.zshrc` so it persists across sessions.

## 3. Install Multus CNI

Deploy the Multus daemonset (thick plugin):

```bash
kubectl apply -f \
https://raw.githubusercontent.com/k8snetworkplumbingwg/multus-cni/master/deployments/multus-daemonset-thick.yml
```

Verify the pods are running:

```bash
kubectl get pods -n kube-system | grep multus
```

## 4. Install Whereabouts IPAM

Apply the required CRDs and the daemonset:

```bash
kubectl apply -f \
https://raw.githubusercontent.com/k8snetworkplumbingwg/whereabouts/master/doc/crds/whereabouts.cni.cncf.io_ippools.yaml

kubectl apply -f \
https://raw.githubusercontent.com/k8snetworkplumbingwg/whereabouts/master/doc/crds/whereabouts.cni.cncf.io_overlappingrangeipreservations.yaml

kubectl apply -f \
https://raw.githubusercontent.com/k8snetworkplumbingwg/whereabouts/master/doc/crds/daemonset-install.yaml
```

Verify the pods are running:

```bash
kubectl get pods -n kube-system | grep whereabouts
```

## 5. Install CNI Plugins

Download and extract the CNI plugins:

```bash
cd /tmp
curl -LO \
https://github.com/containernetworking/plugins/releases/download/v1.5.1/cni-plugins-linux-amd64-v1.5.1.tgz

sudo tar -xzf cni-plugins-linux-amd64-v1.5.1.tgz \
-C /opt/cni/bin

ls /opt/cni/bin/macvlan
```

Copy the required plugin binaries into the K3s CNI data directory:

```bash
sudo cp /opt/cni/bin/multus-shim /var/lib/rancher/k3s/data/cni/
sudo cp /opt/cni/bin/macvlan /var/lib/rancher/k3s/data/cni/
sudo cp /opt/cni/bin/whereabouts /var/lib/rancher/k3s/data/cni/
sudo chmod +x /var/lib/rancher/k3s/data/cni/*
```

Copy the flannel binary back to `/opt/cni/bin`:

```bash
sudo cp /var/lib/rancher/k3s/data/cni/flannel /opt/cni/bin/
sudo chmod +x /opt/cni/bin/flannel
```

## 6. Patch Multus DaemonSet

Update the Multus DaemonSet's hostPath volume to point to the correct K3s CNI config directory:

```bash
kubectl -n kube-system patch ds kube-multus-ds --type='json' -p='[
  {
    "op": "replace",
    "path": "/spec/template/spec/volumes/0/hostPath/path",
    "value": "/var/lib/rancher/k3s/agent/etc/cni/net.d"
  }
]'
```

---

## 7. Uninstall K3s

```bash
# Run the K3s uninstall script
sudo /usr/local/bin/k3s-uninstall.sh

# Clean out your local kubectl client configs
rm -rf ~/.kube

# Remove any lingering system configuration folders
sudo rm -rf /etc/rancher /var/lib/rancher /var/log/pods /var/log/containers

# Reset permissions (if k3s.yaml still exists / for reinstall scenarios)
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
```
