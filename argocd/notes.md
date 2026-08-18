ArgoCD (v3.5.1 in this cluster) ignores the argocd-cm `repositories` key entirely — repos must be
declared as a Secret labeled `argocd.argoproj.io/secret-type: repository`. Credentials live directly
in that Secret (no separate cred-secret indirection available for this format).

Create the repo secret imperatively (avoids putting the real PAT in a tracked file), then label it:

```
kubectl -n argocd create secret generic lab-repo-creds \
  --from-literal=type=git \
  --from-literal=url=https://github.com/akxrepo/lab.git \
  --from-literal=password=<GITHUB_PAT>
kubectl -n argocd label secret lab-repo-creds argocd.argoproj.io/secret-type=repository
```

Or apply repository.yaml directly after filling in the `password` placeholder.

Cleanup: remove the stale `repositories` key left on argocd-cm from the earlier (non-functional) attempt:

```
kubectl -n argocd patch cm argocd-cm --type=json -p='[{"op":"remove","path":"/data/repositories"}]'
```
