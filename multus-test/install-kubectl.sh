#!/bin/bash
cd ~/bin

curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

chmod +x kubectl

echo "# Source bash-completion explicitly" >> ~/.bashrc
echo "source /usr/share/bash-completion/bash_completion 2>/dev/null || true" >> ~/.bashrc

# kubectl completion + alias
echo "source <(kubectl completion bash)" >> ~/.bashrc
echo "alias k=kubectl" >> ~/.bashrc
echo "complete -o default -F __start_kubectl k" >> ~/.bashrc

# Terraform
echo "complete -C /usr/local/bin/terraform terraform" >> ~/.bashrc

source ~/.bashrc
