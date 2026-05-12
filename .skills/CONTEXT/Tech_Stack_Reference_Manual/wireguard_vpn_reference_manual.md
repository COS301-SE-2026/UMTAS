# WireGuard VPN Reference Manual (v1.0.0 Stable)

## Section 0: Quick Start

Setup a secure point-to-point tunnel between two peers.

```bash
# Generate private and public keys
wg genkey | tee privatekey | wg pubkey > publickey

# Basic interface configuration (/etc/wireguard/wg0.conf)
echo "[Interface]
PrivateKey = <Local_Private_Key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <Remote_Public_Key>
Endpoint = <Remote_IP>:51820
AllowedIPs = 10.0.0.2/32" > wg0.conf

# Start the interface
wg-quick up ./wg0.conf
```

Expected output: Interface `wg0` is up and traffic is routed to `10.0.0.2` via the tunnel.

## Section 1: Key Language Terms & Features

- **Peer** — A single participant in a WireGuard network (could be a server or a client). | `[Peer]` | ⚠️ WireGuard is strictly peer-to-peer; every "client" is technically a peer.
- **AllowedIPs** — List of IP ranges that are permitted to send/receive traffic through the tunnel. | `AllowedIPs = 10.0.0.0/24` | ⚠️ Acts as both a routing table and a cryptokey-routing ACL.
- **Endpoint** — The public IP and port where a peer can be reached. | `Endpoint = 1.2.3.4:51820` | ⚠️ Only one peer in a connection needs a fixed endpoint (static IP).
- **ListenPort** — The UDP port on which the interface listens for incoming packets. | `ListenPort = 51820` | ⚠️ Ensure this port is open in your firewall (UDP, not TCP).
- **PrivateKey / PublicKey** — Pair of Curve25519 keys used for identity and encryption. | `PrivateKey = ...` | ⚠️ NEVER share your private key; only the public key is exchanged.
- **PresharedKey (PSK)** — An optional symmetric key added to provide post-quantum security. | `PresharedKey = ...` | ⚠️ Both peers must have the exact same PSK for the connection to work.
- **Keepalive** — Small packet sent periodically to keep NAT mappings or stateful firewalls open. | `PersistentKeepalive = 25` | ⚠️ Essential for peers behind NAT to remain reachable from the public internet.
- **Cryptokey Routing** — WireGuard's core mechanism linking public keys to specific AllowedIPs. | (Internal mechanism) | ⚠️ Ensures that only the peer with the matching key can use those IPs.
- **Roaming** — The ability for a peer to change its IP address without dropping the connection. | (Automatic) | ⚠️ WireGuard updates the endpoint automatically when a valid packet arrives from a new IP.
- **wg-quick** — A helper script to simplify the creation and tear-down of interfaces. | `wg-quick up wg0` | ⚠️ Automatically handles routing and DNS settings defined in the config file.

## Section 2: Key Commands & Workflows

- `wg genkey` — Generates a new random private key. | _Creating credentials._
- `wg pubkey` — Derives a public key from a private key provided via stdin. | _Extracting public identity._
- `wg show` — Displays the current status of all WireGuard interfaces. | _Monitoring and debugging._
- `wg-quick up wg0` — Starts the `wg0` interface using its configuration file. | _Establishing the tunnel._
- `wg-quick down wg0` — Stops the `wg0` interface and cleans up routes. | _Terminating the connection._
- `wg set wg0 peer <PK> endpoint <IP>:<Port>` — Updates a peer's endpoint dynamically. | _Manual peer management._
- `wg setconf wg0 ./wg0.conf` — Applies a configuration file to an active interface. | _Updating settings without downtime._
- `journalctl -u wg-quick@wg0` — Checks the system logs for the WireGuard service. | _Troubleshooting startup issues._

## Section 3: Architecture & Component Relationships

```
Application Traffic (TCP/UDP/ICMP)
       ↓
Virtual Interface (wg0)
       ↓ (AllowedIPs Routing)
WireGuard Kernel Module (Encryption & Encapsulation)
       ↓ (UDP Packet)
Physical Network (Internet/LAN)
       ↓
Remote WireGuard Peer (Decapsulation & Decryption)
       ↓
Remote Virtual Interface (wg0)
```

**Key Flow:** WireGuard operates as a **Virtual Network Interface**. It intercepts traffic, checks the **AllowedIPs**, encrypts it using the **Peer's Public Key**, and sends it over **UDP** to the **Endpoint**.

## Section 4: Documentation Links

- [Official WireGuard Site](https://www.wireguard.com/) — _Main homepage and technical whitepaper._
- [WireGuard Installation](https://www.wireguard.com/install/) — _Guides for Linux, Windows, macOS, Android, and iOS._
- [Quick Start Guide](https://www.wireguard.com/quickstart/) — _Minimal commands to get a tunnel running._
- [WireGuard Tools GitHub](https://github.com/WireGuard/wireguard-tools) — _Source code for `wg` and `wg-quick`._
- [Kernel Documentation](https://www.kernel.org/doc/Documentation/networking/wireguard.txt) — _Deep dive into the Linux kernel implementation._
