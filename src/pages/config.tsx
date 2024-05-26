import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useId, useRef, useState } from 'react';
import { BaseLayout } from '@/layouts/base.tsx';
import { GITHUB_REPO } from '@/constants/link';
import { createZipAndDownload, getRandomPort } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PeerCard, PeerCardRef } from '@/components/peerCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SquareArrowOutUpRight } from 'lucide-react';
import { isIP } from 'is-ip';
import isCIDR from 'is-cidr';
import { Textarea } from '@/components/ui/textarea';
import { batchIncrementIP, getCidrAddress } from '@/lib/ip';

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

type ConfigForm = Partial<WireGuardConfig & PeerSection> & { quantity: number };

const defaultForm: ConfigForm = {
  address: '10.0.0.1/24',
  dns: '',
  listenPort: getRandomPort(),
  mtu: 0,
  saveConfig: '',
  allowedIPs: '0.0.0.0/0, ::/0',
  endpoint: '',
  persistentKeepalive: 25,
  reserved: '',
  quantity: 2,
  preUp: '',
  postUp: '',
  preDown: '',
  postDown: '',
  table: '',
  fwMark: '',
};

export function QuickConfigPage() {
  const id = useId();
  const { toast } = useToast();
  const peerRefs = useRef<(PeerCardRef | null)[]>([]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<ConfigForm>(defaultForm);
  const [formErr, setFormErr] = useState<Record<string, string>>({});
  const [peerConfList, setPeerConfList] = useState<WireGuardConfig[]>([]);

  const validateForm: () => boolean = () => {
    setFormErr({});
    // >> address required <<
    const address = form.address
      ?.split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    if (!address?.length) {
      setFormErr((prev) => ({ ...prev, address: 'Address is required' }));
      return false;
    }
    if (
      !address.every((a) => {
        if (isIP(a)) return true;
        if (isCIDR(a)) return true;
        return false;
      })
    ) {
      setFormErr((prev) => ({ ...prev, address: 'Invalid address' }));
      return false;
    }
    // >> dns <<
    if (form.dns) {
      const dns = form.dns
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      if (dns.some((d) => !isIP(d))) {
        setFormErr((prev) => ({ ...prev, dns: 'Invalid DNS' }));
        return false;
      }
    }
    // >> listenPort <<
    if (form.listenPort && (form.listenPort < 1 || form.listenPort > 65535)) {
      setFormErr((prev) => ({ ...prev, listenPort: 'Invalid port' }));
      return false;
    }
    // >> mtu <<
    // simply check if it is a positive integer
    if (form.mtu && (Number.isNaN(form.mtu) || form.mtu < 1)) {
      setFormErr((prev) => ({ ...prev, mtu: 'Invalid MTU' }));
      return false;
    }
    // >> saveConfig <<
    if (form.saveConfig) {
      if (form.saveConfig !== 'true' && form.saveConfig !== 'false') {
        setFormErr((prev) => ({ ...prev, saveConfig: 'Invalid saveConfig' }));
        return false;
      }
    }
    // >> allowedIPs required <<
    const allowedIPs = form.allowedIPs
      ?.split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    if (!allowedIPs?.length) {
      setFormErr((prev) => ({ ...prev, allowedIPs: 'AllowedIPs is required' }));
      return false;
    }
    if (allowedIPs.some((cidr) => !isCIDR(cidr))) {
      setFormErr((prev) => ({ ...prev, allowedIPs: 'Invalid AllowedIPs' }));
      return false;
    }
    // >> endpoint required <<
    if (!form.endpoint) {
      setFormErr((prev) => ({ ...prev, endpoint: 'Endpoint is required' }));
      return false;
    }
    const endpoints: string[] = [];
    for (const endpoint of form.endpoint.split(',')) {
      const list = endpoint.split(':');

      if (list.length > 2) {
        setFormErr((prev) => ({ ...prev, endpoint: 'Invalid endpoint' }));
        return false;
      }

      endpoints.push(
        list.length === 1 ? `${list[0].trim()}:${form.listenPort}` : endpoint,
      );
    }
    form.endpoint = endpoints.join(',');
    // >> persistentKeepalive <<
    if (
      form.persistentKeepalive &&
      (form.persistentKeepalive < 1 || form.persistentKeepalive > 65535)
    ) {
      setFormErr((prev) => ({
        ...prev,
        persistentKeepalive: 'Invalid persistentKeepalive',
      }));
      return false;
    }
    // >> reserved << no need to validate
    // >> quantity <<
    if (form.quantity && (Number.isNaN(form.quantity) || form.quantity < 1)) {
      setFormErr((prev) => ({ ...prev, quantity: 'Invalid quantity' }));
      return false;
    }
    // no validation for advanced options

    return true;
  };

  const generateConfig = () => {
    if (!validateForm()) return;

    const keyPairList: string[][] = [];
    const addressList: string[] = [];
    for (let i = 0; i < form.quantity; i++) {
      keyPairList.push(window.wgCtrl.genKeyPair());
      try {
        const address = batchIncrementIP(form.address!, i);
        addressList.push(address);
      } catch (err) {
        toast({
          title: 'IP Address increment Error!',
          description: 'Please change Address or Peer Quantity.',
          variant: 'destructive',
        });
        throw err;
      }
    }

    const endpoints = form.endpoint!.split(',').map((e) => e.trim());
    const wgConfList: WireGuardConfig[] = [];
    for (let j = 0; j < form.quantity; j++) {
      const wgConf: Partial<WireGuardConfig> = {
        privateKey: keyPairList[j][0],
        address: addressList[j],
        dns: form.dns,
        mtu: form.mtu,
      };

      if (endpoints[j]) {
        wgConf.listenPort = Number(endpoints[j].split(':')[1]);
        wgConf.saveConfig = form.saveConfig;
        wgConf.preUp = form.preUp;
        wgConf.postUp = form.postUp;
        wgConf.preDown = form.preDown;
        wgConf.postDown = form.postDown;
        wgConf.table = form.table;
        wgConf.fwMark = form.fwMark;
        wgConf.peers = keyPairList
          .map(([_, publicKey], index) => {
            if (index === j) return null;

            const peer: PeerSection = {
              publicKey,
              allowedIPs: getCidrAddress(addressList[index]),
            };
            if (endpoints[index]) peer.endpoint = endpoints[index];

            return peer;
          })
          .filter(Boolean) as PeerSection[];
      } else {
        wgConf.peers = keyPairList
          .map(([_, publicKey], index) => {
            if (index === j || !endpoints[index]) return null;

            return {
              publicKey,
              allowedIPs: form.allowedIPs ?? '',
              endpoint: endpoints[index],
              persistentKeepalive: form.persistentKeepalive,
              reserved: form.reserved,
            };
          })
          .filter(Boolean) as PeerSection[];
      }

      wgConfList.push(wgConf as WireGuardConfig);
    }
    setPeerConfList(wgConfList);
  };

  const downloadZip = () => {
    createZipAndDownload(
      peerRefs.current.map((ref) => ref!.getConf()),
      'wg_conf.zip',
    ).catch((err) => {
      console.error(err);
      toast({
        title: 'Download Zip Error!',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    });
  };

  const resetForm = () => {
    setForm(defaultForm);
    setFormErr({});
  };

  return (
    <BaseLayout>
      <div className="flex flex-col items-center gap-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>WireGuard Quick Config</CardTitle>
            <CardDescription>
              Pure client-side operation, without any API requests. see{' '}
              <a
                className="inline-flex items-center gap-0.5 font-semibold text-secondary-foreground transition-colors hover:text-inherit"
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
              >
                source code
                <SquareArrowOutUpRight size={13} />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label
                  className="after:ml-0.5 after:text-red-500 after:content-['*']"
                  htmlFor={`address-${id}`}
                >
                  Address
                </Label>
                <Input
                  value={form.address}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, address: e.target.value }));
                  }}
                  className="base-input"
                  id={`address-${id}`}
                  placeholder="Comma separated IP or CIDR"
                />
                {formErr.address ? (
                  <span className="text-xs text-red-500">
                    {formErr.address}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`dns-${id}`}>DNS</Label>
                <Input
                  value={form.dns}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, dns: e.target.value }));
                  }}
                  className="base-input"
                  id={`dns-${id}`}
                  placeholder="DNS"
                />
                {formErr.dns ? (
                  <span className="text-xs text-red-500">{formErr.dns}</span>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor={`listen-port-${id}`}>ListenPort</Label>
                <Input
                  type="number"
                  value={form.listenPort}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      listenPort: Number(e.target.value),
                    }));
                  }}
                  className="base-input"
                  id={`listen-port-${id}`}
                  placeholder="ListenPort"
                />
                {formErr.listenPort ? (
                  <span className="text-xs text-red-500">
                    {formErr.listenPort}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`mtu-${id}`}>MTU</Label>
                <Input
                  value={form.mtu}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      mtu: Number(e.target.value),
                    }));
                  }}
                  type="number"
                  className="base-input"
                  id={`mtu-${id}`}
                  placeholder="MTU"
                />
                {formErr.mtu ? (
                  <span className="text-xs text-red-500">{formErr.mtu}</span>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`save-config-${id}`}>SaveConfig</Label>
                <Select
                  value={form.saveConfig}
                  onValueChange={(value) => {
                    setForm((prev) => ({
                      ...prev,
                      saveConfig: value,
                    }));
                  }}
                >
                  <SelectTrigger
                    className="base-select"
                    id={`save-config-${id}`}
                  >
                    <SelectValue placeholder="True or False" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
                {formErr.saveConfig ? (
                  <span className="text-xs text-red-500">
                    {formErr.saveConfig}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label
                  className="after:ml-0.5 after:text-red-500 after:content-['*']"
                  htmlFor={`allowed-ips-${id}`}
                >
                  AllowedIPs
                </Label>
                <Input
                  value={form.allowedIPs}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      allowedIPs: e.target.value,
                    }));
                  }}
                  className="base-input"
                  id={`allowed-ips-${id}`}
                  placeholder="Comma separated list of IP (v4 or v6) addresses with CIDR masks"
                />
                {formErr.allowedIPs ? (
                  <span className="text-xs text-red-500">
                    {formErr.allowedIPs}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label
                  className="after:ml-0.5 after:text-red-500 after:content-['*']"
                  htmlFor={`endpoint-${id}`}
                >
                  Endpoint
                </Label>
                <Input
                  autoFocus
                  value={form.endpoint}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      endpoint: e.target.value,
                    }));
                  }}
                  className="base-input"
                  id={`endpoint-${id}`}
                  placeholder="Change it to your server host"
                />
                {formErr.endpoint ? (
                  <span className="text-xs text-red-500">
                    {formErr.endpoint}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor={`persistent-keepalive-${id}`}>
                  PersistentKeepalive
                </Label>
                <Input
                  value={form.persistentKeepalive}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      persistentKeepalive: Number(e.target.value),
                    }));
                  }}
                  type="number"
                  className="base-input"
                  id={`persistent-keepalive-${id}`}
                  placeholder="PersistentKeepalive"
                />
                {formErr.persistentKeepalive ? (
                  <span className="text-xs text-red-500">
                    {formErr.persistentKeepalive}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`reserved-${id}`}>Reserved</Label>
                <Input
                  className="base-input"
                  id={`reserved-${id}`}
                  placeholder="Comma separated value"
                  value={form.reserved}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reserved: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`peer-quantity-${id}`}>Peer Quantity</Label>
                <Input
                  type="number"
                  className="base-input"
                  id={`peer-quantity-${id}`}
                  placeholder="Peer Quantity"
                  value={form.quantity}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                    }));
                  }}
                />
                {formErr.quantity ? (
                  <span className="text-xs text-red-500">
                    {formErr.quantity}
                  </span>
                ) : null}
              </div>
            </div>
            {showAdvanced ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor={`pre-up-${id}`}>PreUp</Label>
                  <Textarea
                    className="base-input font-mono"
                    id={`pre-up-${id}`}
                    placeholder="PreUp"
                    value={form.preUp}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, preUp: e.target.value }));
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`post-up-${id}`}>PostUp</Label>
                  <Textarea
                    className="base-input font-mono"
                    id={`post-up-${id}`}
                    placeholder="PostUp"
                    value={form.postUp}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, postUp: e.target.value }));
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`pre-down-${id}`}>PreDown</Label>
                  <Textarea
                    className="base-input font-mono"
                    id={`pre-down-${id}`}
                    placeholder="PreDown"
                    value={form.preDown}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, preDown: e.target.value }));
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`post-down{id}`}>PostDown</Label>
                  <Textarea
                    className="base-input font-mono"
                    id={`post-down-${id}`}
                    placeholder="PostDown"
                    value={form.postDown}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        postDown: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`table-${id}`}>Table</Label>
                    <Input
                      className="base-input"
                      id={`table-${id}`}
                      placeholder="Table"
                      value={form.table}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, table: e.target.value }));
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`fw-mark-${id}`}>FwMark</Label>
                    <Input
                      className="base-input"
                      id={`fw-mark-${id}`}
                      placeholder="FwMark"
                      value={form.fwMark}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          fwMark: e.target.value,
                        }));
                      }}
                    />
                  </div>
                </div>
              </>
            ) : null}
            <Button
              className="h-6 hover:text-slate-500	hover:no-underline"
              variant="link"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {(showAdvanced ? 'Hide' : 'Show') + ' Advanced Options'}
            </Button>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              className="mr-2"
              variant="outline"
              size="sm"
              onClick={resetForm}
            >
              Reset
            </Button>
            <Button
              className="mr-2"
              variant="destructive"
              size="sm"
              disabled={!peerConfList.length}
              onClick={downloadZip}
            >
              Download zip
            </Button>
            <Button size="sm" onClick={generateConfig}>
              Generate
            </Button>
          </CardFooter>
        </Card>
        <div className="flex w-full max-w-3xl flex-col gap-2">
          {peerConfList.map((config, index) => (
            <PeerCard
              key={index}
              ref={(el) => (peerRefs.current[index] = el)}
              title={`wg${index}`}
              conf={config}
            />
          ))}
        </div>
      </div>
    </BaseLayout>
  );
}
