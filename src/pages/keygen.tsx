import { useEffect, useState } from 'react';
import { BaseLayout } from '@/layouts/base.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { KeyItem } from '@/components/keyItem.tsx';

export function KeyGenPage() {
  const [keyPair, setKeyPair] = useState<string[]>([]);
  const [preSharedKey, setPreSharedKey] = useState<string>('');

  useEffect(() => {
    generateKeyPair();
    generatePreSharedKey();
  }, []);

  const generateKeyPair = () => {
    setKeyPair(window.wgCtrl.genKeyPair());
  };
  const generatePreSharedKey = () => {
    setPreSharedKey(window.wgCtrl.genPreKey());
  };

  return (
    <BaseLayout>
      <div className="flex flex-col items-center gap-20">
        <Card>
          <CardHeader>
            <Button variant="outline" onClick={generateKeyPair}>
              Generate Key Pair
            </Button>
          </CardHeader>
          <CardContent>
            <KeyItem label="Private Key" content={keyPair[0]} />
            <KeyItem label="Public Key" content={keyPair[1]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Button variant="outline" onClick={generatePreSharedKey}>
              Generate PreShared Key
            </Button>
          </CardHeader>
          <CardContent>
            <KeyItem label="PreShared Key" content={preSharedKey} />
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  );
}
