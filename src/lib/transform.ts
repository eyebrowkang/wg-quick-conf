/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { parseToWgConf } from './wg';
import { dump } from 'js-yaml';
import stringify from 'json-stringify-pretty-compact';

export function surge(confText: string): string {
  const wgConf = parseToWgConf(confText);
  const [v4, v6] = getSelfIP(wgConf.address);
  const sectionName = generateRandomSectionName();

  let conf = `[Proxy]\nwg-proxy = wireguard, section-name = ${sectionName}\n`;
  conf += `\n[WireGuard ${sectionName}]\n`;
  conf += `private-key = ${wgConf.privateKey}\n`;
  if (v4) conf += `self-ip = ${v4}\n`;
  if (v6) conf += `self-ip-v6 = ${v6}\n`;
  if (wgConf.dns) conf += `dns-server = ${wgConf.dns}\n`;
  if (wgConf.mtu) conf += `mtu = ${wgConf.mtu}\n`;
  conf += `peer = `;

  wgConf.peers.forEach((peer, index) => {
    if (index !== 0) conf += ', ';
    conf += `(public-key = ${peer.publicKey}, allowed-ips = "${peer.allowedIPs}"`;
    if (peer.endpoint) conf += `, endpoint = ${peer.endpoint}`;
    if (peer.presharedKey) conf += `, preshared-key = ${peer.presharedKey}`;
    if (peer.persistentKeepalive)
      conf += `, keepalive = ${peer.persistentKeepalive}`;
    if (peer.reserved)
      conf += `, client-id = ${peer.reserved
        .split(',')
        .map((i) => i.trim())
        .join('/')}`;
    conf += `)`;
  });

  return conf;
}

export function mihomo(confText: string): string {
  const wgConf = parseToWgConf(confText);
  const proxy: any = {
    name: 'wg',
    type: 'wireguard',
    'private-key': wgConf.privateKey,
    udp: true,
  };
  const [v4, v6] = getSelfIP(wgConf.address);
  if (v4) proxy.ip = v4;
  if (v6) proxy.ipv6 = v6;
  if (wgConf.dns) {
    proxy['remote-dns-resolve'] = true;
    proxy.dns = wgConf.dns.split(',').map((i) => i.trim());
  }
  if (wgConf.mtu) proxy.mtu = wgConf.mtu;

  const peers = [];
  for (const peer of wgConf.peers) {
    const peerProxy: any = {
      'public-key': peer.publicKey,
      'allowed-ips': peer.allowedIPs.split(',').map((i) => i.trim()),
    };
    if (peer.endpoint) {
      const [server, port] = peer.endpoint.split(':').map((i) => i.trim());
      if (server) peerProxy.server = server;
      if (port) peerProxy.port = parseInt(port, 10);
    }
    if (peer.presharedKey) peerProxy['pre-shared-key'] = peer.presharedKey;
    if (peer.reserved)
      peerProxy.reserved = peer.reserved.split(',').map((i) => {
        const item = i.trim();
        if (/^\d+$/.test(item)) {
          return Number(item);
        } else {
          return item;
        }
      });

    peers.push(peerProxy);
  }

  // 这样写只是为了格式好看一点
  return `${dump(proxy, {
    flowLevel: 1,
  })}peers:\n${dump(peers, {
    flowLevel: 2,
  })
    .split('\n')
    .map((p) => (p ? `  ${p}` : p))
    .join('\n')}`;
}

export function singBox(confText: string): string {
  const wgConf = parseToWgConf(confText);
  const peers = wgConf.peers.map((peer) => {
    const p: any = {};
    if (peer.endpoint) {
      const [server, port] = peer.endpoint.split(':').map((i) => i.trim());
      p.server = server;
      p.server_port = parseInt(port, 10);
    }
    p.public_key = peer.publicKey;
    if (peer.presharedKey) {
      p.pre_shared_key = peer.presharedKey;
    }
    if (peer.allowedIPs) {
      p.allowed_ips = peer.allowedIPs.split(',').map((i) => i.trim());
    }
    if (peer.reserved) {
      p.reserved = peer.reserved.split(',').map((i) => {
        const item = i.trim();
        if (/^\d+$/.test(item)) {
          return Number(item);
        } else {
          return item;
        }
      });
    }
    return p;
  });
  const wg = {
    type: 'wireguard',
    tag: 'wireguard-out',
    local_address: wgConf.address.split(',').map((i) => i.trim()),
    private_key: wgConf.privateKey,
    mtu: wgConf.mtu,
    peers,
  };
  return stringify(wg, {
    maxLength: 80,
    indent: 2,
  });
}

function generateRandomSectionName(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  let result = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters.charAt(randomIndex);
  }

  return result;
}

function getSelfIP(str: string): [string, string] {
  let v4 = '';
  let v6 = '';
  const list = str.split(',');

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < list.length; i++) {
    let item = list[i];
    if (item.includes('/')) {
      item = item.split('/')[0];
    }
    if (item.includes(':')) {
      v6 = item;
    } else {
      v4 = item;
    }
  }

  return [v4, v6];
}
