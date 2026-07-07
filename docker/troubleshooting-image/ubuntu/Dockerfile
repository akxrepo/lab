FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
        bash \
        curl \
        wget \
        iproute2 \
        iputils-ping \
        dnsutils \
        net-tools \
        netcat-openbsd \
        traceroute \
        mtr-tiny \
        tcpdump \
        openssl \
        jq \
        procps \
        socat \
        vim-tiny \
        less && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

CMD ["bash"]
