import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Link, Route, Switch } from 'wouter';
import { ClipboardIcon, CheckIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.tsx';

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
      <div className="flex items-center w-full h-14 bg-neutral-200 shadow text-slate-100 px-4">
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
          <div className="flex flex-col items-center mt-20 gap-20">
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
          <div className="flex flex-1 items-center">
            <div className="m-auto flex items-center">
              <div className="border-r-2 border-slate-900 mr-4 pr-4 text-2xl">
                404
              </div>
              <div>This page could not be found.</div>
            </div>
          </div>
        </Route>
      </Switch>
    </>
  );
}

function KeyItem({ label, content }: { label: string; content: string }) {
  const [hasCopied, setHasCopied] = useState(false);

  const copyContent = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setHasCopied(true);
        setTimeout(() => {
          setHasCopied(false);
        }, 1200);
      })
      .catch((err) => console.error('Could not copy text: ', err));
  };

  return (
    <div>
      <div className="flex items-center">
        <div>{label}</div>
      </div>
      <div className="relative flex items-center">
        <pre className="rounded-lg border bg-slate-800 py-2 pl-4 pr-10 w-fit">
          <code className="bg-transparent text-slate-100 font-mono text-sm">
            {content}
          </code>
        </pre>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={copyContent}
                variant="ghost"
                size="icon"
                className="text-slate-100 h-6 w-6 ml-auto absolute right-2 hover:bg-slate-700 hover:text-slate-100"
              >
                {hasCopied ? (
                  <CheckIcon size={16} />
                ) : (
                  <ClipboardIcon size={16} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
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
