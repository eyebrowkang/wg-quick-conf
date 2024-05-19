import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Link, Route, Switch } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';
import { KeyItem } from '@/components/keyItem.tsx';
import { NotFoundPage } from '@/pages/404.tsx';

function App() {
  const [keyPair, setKeyPair] = useState<string[]>([]);
  const [preSharedKey, setPreSharedKey] = useState<string>('');

  useEffect(() => {
    loadWgCtrl()
      .then(() => {
        generateKeyPair();
        generatePreSharedKey();
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const generateKeyPair = () => {
    setKeyPair(window.wgCtrl.genKeyPair());
  };
  const generatePreSharedKey = () => {
    setPreSharedKey(window.wgCtrl.genPreKey());
  };

  return (
    <>
      <div className="flex h-14 w-full items-center bg-neutral-200 px-4 text-slate-100 shadow">
        <Link href="/">
          <img
            className="text-black"
            src="/wg-nobg.svg"
            alt="website logo"
            width={40}
          />
        </Link>
        <div className="ml-16 flex items-center gap-4">
          <Button className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300">
            <Link href="/config">Quick Config</Link>
          </Button>
          <Button className="bg-neutral-200 text-neutral-950 hover:bg-neutral-300">
            <Link href="/transform">Config Transform</Link>
          </Button>
        </div>
      </div>
      <Switch>
        <Route path="/">
          <div className="mt-20 flex flex-col items-center gap-20 px-4">
            <Card>
              <CardHeader>
                <Button onClick={generateKeyPair}>Generate Key Pair</Button>
              </CardHeader>
              <CardContent>
                <KeyItem label="Private Key" content={keyPair[0]} />
                <KeyItem label="Public Key" content={keyPair[1]} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Button onClick={generatePreSharedKey}>
                  Generate PreShared Key
                </Button>
              </CardHeader>
              <CardContent>
                <KeyItem label="PreShared Key" content={preSharedKey} />
              </CardContent>
            </Card>
          </div>
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>
    </>
  );
}

declare class Go {
  importObject: WebAssembly.Imports;

  run(instance: WebAssembly.Instance): Promise<void>;
}

async function loadWgCtrl(): Promise<void> {
  const go = new Go();
  const WASM_URL = '/main.wasm';

  try {
    const result = await WebAssembly.instantiateStreaming(
      await fetch(WASM_URL),
      go.importObject,
    );
    void go.run(result.instance);
  } catch (err) {
    return Promise.reject(err);
  }

  return Promise.resolve();
}

export default App;
