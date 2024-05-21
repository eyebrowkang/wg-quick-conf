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
import { useMemo, useId, useState } from 'react';
import { BaseLayout } from '@/layouts/base.tsx';
import { GITHUB_REPO } from '@/constants/link';
import { createZipAndDownload, getRandomPort } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PeerCard } from '@/components/peerCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PeerSection {
  publicKey: string;
  presharedKey?: string;
  allowedIPs: string;
  persistentKeepalive?: number; // between 1 and 65535 inclusive
  endpoint?: string;
  reserved?: string[];
}

export interface WireGuardConfig {
  // Interface Section
  privateKey: string;
  listenPort?: number; // random by default (10000-65535)
  fwMark?: string;
  // handled by wg-quick
  address: string; // ip or cidr, e.g. 10.0.0.1/24, fd00::1/64
  dns?: string;
  mtu?: string;
  table?: string;
  saveConfig?: boolean;
  preUp?: string;
  postUp?: string;
  preDown?: string;
  postDown?: string;
  // Peer Section
  peers: PeerSection[];
}

const defaultPeerConfig: PeerSection = {
  publicKey: '',
  presharedKey: '',
  allowedIPs: '0.0.0.0/0, ::/0',
  persistentKeepalive: 25,
  endpoint: '',
  reserved: [],
};

const defaultInterfaceConfig: WireGuardConfig = {
  privateKey: '',
  listenPort: getRandomPort(),
  fwMark: '',
  address: '10.0.0.1/24',
  dns: '',
  mtu: '',
  table: '',
  saveConfig: false,
  preUp: '',
  postUp: '',
  preDown: '',
  postDown: '',
  peers: [defaultPeerConfig],
};

export function QuickConfigPage() {
  const id = useId();
  const { toast } = useToast();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [quantity, setQuantity] = useState(2);

  const [form, setForm] = useState({
    address: '10.0.0.1/24',
    listenPort: '51820',
    dns: '',
    mtu: '',
    peerQuantity: '2',
    allowedIPs: '0.0.0.0/0, ::/0',
    endpoint: '',
  });
  const [keyPairList, setKeyPairList] = useState<string[][]>([]);
  const confList = useMemo(() => {
    return keyPairList.map(([privateKey, publicKey], index) => {
      let interfaceSection = `[Interface]\nPrivateKey = ${privateKey}\nAddress = ${form.address}\nListenPort = ${form.listenPort}\n`;
      if (form.dns) {
        interfaceSection += `DNS = ${form.dns}\n`;
      }
      if (form.mtu) {
        interfaceSection += `MTU = ${form.mtu}\n`;
      }

      let peerSection: string;
      if (index === 0) {
        peerSection = keyPairList
          .filter(([_, pub]) => pub !== publicKey)
          .map(([_, pubKey]) => {
            return `[Peer]\nPublicKey = ${pubKey}\nAllowedIPs = ${form.allowedIPs}\n`;
          })
          .join('\n');
      } else {
        peerSection = `[Peer]\nPublicKey = ${keyPairList[0][1]}\nAllowedIPs = ${form.allowedIPs}\nEndpoint = ${form.endpoint}:${form.listenPort}\n`;
      }

      return interfaceSection + '\n' + peerSection;
    });
  }, [form, keyPairList]);

  const generateConfig = () => {
    const list: string[][] = [];
    for (let i = 0; i < quantity; i++) {
      list.push(window.wgCtrl.genKeyPair());
    }
    setKeyPairList(list);
  };

  const downloadZip = () => {
    createZipAndDownload(
      confList.map((config, index) => {
        return {
          name: `peer${index}.conf`,
          content: config,
        };
      }),
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

  return (
    <BaseLayout>
      <div className="flex flex-col items-center gap-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>WireGuard Quick Config</CardTitle>
            <CardDescription>
              Pure client-side operation, without any API requests. see{' '}
              <a
                className="underline"
                href={GITHUB_REPO}
                target="_blank"
                rel="noreferrer"
              >
                source code
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
                  placeholder="Address"
                />
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
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor={`listen-port-${id}`}>ListenPort</Label>
                <Input
                  value={form.listenPort}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      listenPort: e.target.value,
                    }));
                  }}
                  className="base-input"
                  id={`listen-port-${id}`}
                  placeholder="ListenPort"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`mtu-${id}`}>MTU</Label>
                <Input
                  value={form.mtu}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      mtu: e.target.value,
                    }));
                  }}
                  className="base-input"
                  id={`mtu-${id}`}
                  placeholder="MTU"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`save-config-${id}`}>SaveConfig</Label>
                <Select defaultValue="no">
                  <SelectTrigger className="base-select">
                    <SelectValue placeholder="SaveConfig" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`allowed-ips-${id}`}>AllowedIPs</Label>
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
                  placeholder="AllowedIPs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`endpoint-${id}`}>Endpoint</Label>
                <Input
                  autoFocus
                  value={form.endpoint}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, endpoint: e.target.value }));
                  }}
                  className="base-input"
                  id={`endpoint-${id}`}
                  placeholder="Change it to your server host"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor={`persistent-keepalive-${id}`}>
                  PersistentKeepalive
                </Label>
                <Input
                  value={form.dns}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, dns: e.target.value }));
                  }}
                  className="base-input"
                  id={`persistent-keepalive-${id}`}
                  placeholder="PersistentKeepalive"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`reserved-${id}`}>Reserved</Label>
                <Input
                  className="base-input"
                  id={`reserved-${id}`}
                  placeholder="comma separated value"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`peer-quantity-${id}`}>Peer Quantity</Label>
                <Input
                  type="number"
                  className="base-input"
                  id={`peer-quantity-${id}`}
                  placeholder="Peer Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            {showAdvanced ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor={`pre-up-${id}`}>PreUp</Label>
                  <Input
                    className="base-input"
                    id={`pre-up-${id}`}
                    placeholder="PreUp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`post-up-${id}`}>PostUp</Label>
                  <Input
                    className="base-input"
                    id={`post-up-${id}`}
                    placeholder="PostUp"
                  />
                </div>{' '}
                <div className="grid gap-2">
                  <Label htmlFor={`pre-down-${id}`}>PreDown</Label>
                  <Input
                    className="base-input"
                    id={`pre-down-${id}`}
                    placeholder="PreDown"
                  />
                </div>{' '}
                <div className="grid gap-2">
                  <Label htmlFor={`post-down{id}`}>PostDown</Label>
                  <Input
                    className="base-input"
                    id={`post-down-${id}`}
                    placeholder="PostDown"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor={`table-${id}`}>Table</Label>
                    <Input
                      className="base-input"
                      id={`table-${id}`}
                      placeholder="Table"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`fw-mark-${id}`}>FwMark</Label>
                    <Input
                      className="base-input"
                      id={`fw-mark-${id}`}
                      placeholder="FwMark"
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
            <Button className="mr-2" variant="outline" size="sm">
              Reset
            </Button>
            <Button
              className="mr-2"
              variant="destructive"
              size="sm"
              disabled={!confList.length}
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
          {confList.map((config, index) => (
            <PeerCard key={index} title={`peer${index}`} content={config} />
          ))}
        </div>
      </div>
    </BaseLayout>
  );
}
