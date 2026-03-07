"""URL validation utilities to prevent SSRF attacks."""

import ipaddress
import socket
from urllib.parse import urlparse

from fastapi import HTTPException

# Private/internal IP ranges that should be blocked
_BLOCKED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


def validate_api_url(url: str) -> str:
    """Validate that a URL is safe to make requests to (not internal/private).

    Returns the validated URL.
    Raises HTTPException if the URL is unsafe.
    """
    parsed = urlparse(url)

    # Only allow http and https schemes
    if parsed.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail=f"Invalid URL scheme: {parsed.scheme}. Only http/https allowed.")

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=400, detail="Invalid URL: no hostname found.")

    # Resolve hostname to IP and check against blocked ranges
    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"Cannot resolve hostname: {hostname}")

    for addr_info in addr_infos:
        ip = ipaddress.ip_address(addr_info[4][0])
        for network in _BLOCKED_NETWORKS:
            if ip in network:
                raise HTTPException(
                    status_code=400,
                    detail="URL resolves to blocked internal address. External URLs only.",
                )

    return url
