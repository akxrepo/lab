FROM registry.access.redhat.com/ubi9/ubi:latest

LABEL name="netdebug" \
      vendor="Custom" \
      version="1.0.0" \
      summary="OpenShift network troubleshooting image"

RUN dnf install -y --nodocs --allowerasing \
        bash \
        curl \
        wget \
        jq \
        iproute \
        iputils \
        net-tools \
        bind-utils \
        nmap-ncat \
        mtr \
        tcpdump \
        openssl \
        procps-ng \
        findutils \
        which \
        tar \
        gzip \
        unzip \
        vim-minimal \
        less \
        hostname \
        util-linux \
        socat \
    && dnf clean all \
    && rm -rf /var/cache/dnf

RUN mkdir -p /workspace \
    && chown -R 1001:0 /workspace \
    && chmod -R g=u /workspace

WORKDIR /workspace

USER 1001

CMD ["bash"]
