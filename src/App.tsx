import { Route, Switch } from 'wouter';
import { NotFoundPage } from '@/pages/404.tsx';
import { QuickConfigPage } from '@/pages/config.tsx';
import { Toaster } from '@/components/ui/toaster';
import { KeyGenPage } from '@/pages/keygen';
import { loadWgCtrl } from '@/lib/wgctrl.ts';

function App() {
  loadWgCtrl().catch(() => {
    console.error('Failed to load wgctrl');
  });

  return (
    <>
      <Switch>
        <Route path="/">
          <QuickConfigPage />
        </Route>
        <Route path="/keygen">
          <KeyGenPage />
        </Route>
        <Route>
          <NotFoundPage />
        </Route>
      </Switch>

      <Toaster />
    </>
  );
}

export default App;
