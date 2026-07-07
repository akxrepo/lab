# ============================================================
# OpenShift-Certified Minimal Troubleshooting Image
# Base: Red Hat UBI 9 (full) – uses dnf, OpenShift SCC compliant
# Tools: curl, ping, nc, dig, host, nslookup, jq, wget
# ============================================================
FROM registry.access.redhat.com/ubi9/ubi:latest

LABEL name="netdebug-minimal" \
      vendor="Custom" \
      version="1.0.0" \
      summary="Minimal OpenShift-certified network troubleshooting image" \
      description="curl, ping, nc, dig, host, nslookup, jq, wget"

# dnf supports --allowerasing which cleanly replaces curl-minimal → curl
RUN dnf install -y --nodocs --allowerasing \
        iputils \
        nmap-ncat \
        curl \
        wget \
        bind-utils \
        jq \
    && dnf clean all \
    && rm -rf /var/cache/dnf

# OpenShift arbitrary-UID pattern
RUN mkdir -p /workspace \
    && chown -R 1001:0 /workspace \
    && chmod -R g=u /workspace

WORKDIR /workspace

USER 1001

CMD ["bash"]
