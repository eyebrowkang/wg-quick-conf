import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';

import { Label } from '@/components/ui/label.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useMemo, useId, useState } from 'react';
import { BaseLayout } from '@/layouts/base.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { QrCodeIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import QRCode from 'react-qr-code';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function createZipAndDownload(
  files: {
    name: string;
    content: string;
  }[],
) {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.content);
  });

  zip
    .generateAsync({ type: 'blob' })
    .then((content) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      saveAs(content, 'wg_conf.zip');
    })
    .catch((err) => {
      console.error('Error generating zip file:', err);
    });
}

export function QuickConfigPage() {
  const id = useId();
  const inputClassName = `focus-visible:ring-primary-500 focus-visible:ring-inset focus-visible:ring-offset-0 max-md:text-base`;

  const [form, setForm] = useState({
    address: '10.0.0.1/24',
    listenPort: 51820,
    dns: '',
    mtu: 0,
    allowedIPs: '0.0.0.0/0',
    endpoint: 'example.com:51820',
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
    for (let i = 0; i < 5; i++) {
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
    );
  };

  return (
    <BaseLayout>
      <div className="flex flex-col items-center gap-8">
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>WireGuard Quick Config</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor={`address-${id}`}>Address</Label>

              <Input
                value={form.address}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, address: e.target.value }));
                }}
                className={inputClassName}
                id={`address-${id}`}
                placeholder="Address"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor={`listen-port-${id}`}>
                  ListenPort (Optional)
                </Label>
                <Input
                  value={form.listenPort}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      listenPort: parseInt(e.target.value),
                    }));
                  }}
                  className={inputClassName}
                  id={`listen-port-${id}`}
                  placeholder="ListenPort"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`dns-${id}`}>DNS (Optional)</Label>
                <Input
                  value={form.dns}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, dns: e.target.value }));
                  }}
                  className={inputClassName}
                  id={`dns-${id}`}
                  placeholder="DNS"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`mtu-${id}`}>MTU (Optional)</Label>
                <Input
                  value={form.mtu || ''}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      mtu: parseInt(e.target.value),
                    }));
                  }}
                  className={inputClassName}
                  id={`mtu-${id}`}
                  placeholder="MTU"
                />
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
                  className={inputClassName}
                  id={`allowed-ips-${id}`}
                  placeholder="AllowedIPs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`endpoint-${id}`}>Endpoint</Label>
                <Input
                  value={form.endpoint}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, endpoint: e.target.value }));
                  }}
                  className={inputClassName}
                  id={`endpoint-${id}`}
                  placeholder="Endpoint"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            {confList.length ? (
              <Button
                className="mr-2"
                variant="destructive"
                size="sm"
                onClick={downloadZip}
              >
                Download zip
              </Button>
            ) : null}
            <Button className="mr-2" variant="outline" size="sm">
              Reset
            </Button>
            <Button size="sm" onClick={generateConfig}>
              Generate
            </Button>
          </CardFooter>
        </Card>
        <div className="flex w-full max-w-3xl flex-col gap-2">
          {confList.map((config, index) => (
            <Card key={index}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Peer {index}</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <QrCodeIcon size={24} />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-fit p-10">
                    <QRCode value={config} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={config.split('\n').length}
                  className={`${inputClassName} font-mono`}
                  value={config}
                  onChange={() => {
                    // TODO: can't change for now
                  }}
                ></Textarea>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BaseLayout>
  );
}
