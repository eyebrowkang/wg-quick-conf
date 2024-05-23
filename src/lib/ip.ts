import { parseIp, max4, max6, stringifyIp } from 'ip-bigint';
import { isIPv4 } from 'is-ip';

// 确保传入的 str 是有效的 IP 地址 或 CIDR
export function incrementIP(str: string, increment: number) {
  let ip = str;
  let cidrMask = '';
  if (ip.includes('/')) {
    [ip, cidrMask] = ip.split('/');
  }
  const { number, version } = parseIp(ip);
  const num = BigInt(number) + BigInt(increment);
  if (version === 4 && max4 < num) {
    throw new Error('IP Address out of range');
  }
  if (version === 6 && max6 < num) {
    throw new Error('IP Address out of range');
  }

  const newIP = stringifyIp({
    number: num,
    version,
  });

  if (cidrMask) {
    return `${newIP}/${cidrMask}`;
  }

  return newIP;
}

export function batchIncrementIP(ips: string, increment: number) {
  const newIPs = ips.split(',').map((ip) => {
    return incrementIP(ip.trim(), increment);
  });
  return newIPs.join(',');
}

export function getCidrAddress(str: string) {
  const list = str.split(',');

  for (let i = 0; i < list.length; i++) {
    const item = list[i].trim();
    let ip = item;
    if (item.includes('/')) {
      ip = item.split('/')[0];
    }
    if (isIPv4(ip)) {
      list[i] = ip + '/32';
    } else {
      list[i] = ip + '/128';
    }
  }

  return list.join(',');
}
