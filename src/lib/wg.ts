export interface PeerSection {
  publicKey: string;
  presharedKey?: string;
  allowedIPs: string;
  persistentKeepalive?: number; // between 1 and 65535 inclusive
  endpoint?: string;
  reserved?: string;
}

export interface WireGuardConfig {
  // Interface Section
  privateKey: string;
  listenPort?: number; // random by default (10000-65535)
  fwMark?: string;
  // handled by wg-quick
  address: string; // ip or cidr, e.g. 10.0.0.1/24, fd00::1/64
  dns?: string;
  mtu?: number;
  table?: string;
  saveConfig?: string;
  preUp?: string;
  postUp?: string;
  preDown?: string;
  postDown?: string;
  // Peer Section
  peers: PeerSection[];
}

export function generateWgConf(config: WireGuardConfig): string {
  let content = '[Interface]\n';

  content += `PrivateKey = ${config.privateKey}\n`;
  if (config.listenPort) {
    content += `ListenPort = ${config.listenPort}\n`;
  }
  if (config.fwMark) {
    content += `FWMark = ${config.fwMark}\n`;
  }
  content += `Address = ${config.address}\n`;
  if (config.dns) {
    content += `DNS = ${config.dns}\n`;
  }
  if (config.mtu) {
    content += `MTU = ${config.mtu}\n`;
  }
  if (config.table) {
    content += `Table = ${config.table}\n`;
  }
  if (config.saveConfig) {
    content += `SaveConfig = ${config.saveConfig}\n`;
  }
  if (config.preUp) {
    content += `PreUp = ${config.preUp}\n`;
  }
  if (config.postUp) {
    content += `PostUp = ${config.postUp}\n`;
  }
  if (config.preDown) {
    content += `PreDown = ${config.preDown}\n`;
  }
  if (config.postDown) {
    content += `PostDown = ${config.postDown}\n`;
  }

  for (const peer of config.peers) {
    content += '\n[Peer]\n';
    content += `PublicKey = ${peer.publicKey}\n`;
    if (peer.presharedKey) {
      content += `PresharedKey = ${peer.presharedKey}\n`;
    }
    if (peer.endpoint) {
      content += `Endpoint = ${peer.endpoint}\n`;
    }
    content += `AllowedIPs = ${peer.allowedIPs}\n`;
    if (peer.persistentKeepalive) {
      content += `PersistentKeepalive = ${peer.persistentKeepalive}\n`;
    }
    if (peer.reserved) {
      content += `# reserved = ${peer.reserved}\n`;
    }
  }
  return content;
}

export function parseToWgConf(text: string): WireGuardConfig {
  const lines = text.split('\n');
  const config: WireGuardConfig = { privateKey: '', address: '', peers: [] };
  let currentPeer: PeerSection | null = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('# reserved')) {
      line = line.slice(2);
    }

    if (line === '' || line.startsWith('#')) {
      continue; // skip empty lines and comments
    }

    if (line === '[Interface]') {
      currentPeer = null;
      continue;
    }

    if (line === '[Peer]') {
      if (currentPeer) {
        config.peers.push(currentPeer);
      }
      currentPeer = { publicKey: '', allowedIPs: '' };
      continue;
    }

    const [key, value] = line.split('=').map((part) => part.trim());

    if (currentPeer) {
      // Peer section
      switch (key) {
        case 'PublicKey':
          currentPeer.publicKey = value;
          break;
        case 'PresharedKey':
          currentPeer.presharedKey = value;
          break;
        case 'AllowedIPs':
          currentPeer.allowedIPs = value;
          break;
        case 'PersistentKeepalive':
          currentPeer.persistentKeepalive = parseInt(value, 10);
          break;
        case 'Endpoint':
          currentPeer.endpoint = value;
          break;
        case 'reserved':
          currentPeer.reserved = value;
          break;
      }
    } else {
      // Interface section
      switch (key) {
        case 'PrivateKey':
          config.privateKey = value;
          break;
        case 'ListenPort':
          config.listenPort = parseInt(value, 10);
          break;
        case 'FWMark':
          config.fwMark = value;
          break;
        case 'Address':
          config.address = value;
          break;
        case 'DNS':
          config.dns = value;
          break;
        case 'MTU':
          config.mtu = parseInt(value, 10);
          break;
        case 'Table':
          config.table = value;
          break;
        case 'SaveConfig':
          config.saveConfig = value;
          break;
        case 'PreUp':
          config.preUp = value;
          break;
        case 'PostUp':
          config.postUp = value;
          break;
        case 'PreDown':
          config.preDown = value;
          break;
        case 'PostDown':
          config.postDown = value;
          break;
      }
    }
  }

  if (currentPeer) {
    config.peers.push(currentPeer);
  }

  return config;
}
