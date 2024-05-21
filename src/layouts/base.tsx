import { Button } from '@/components/ui/button.tsx';
import { Link } from 'wouter';

export function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed flex h-14 w-full items-center bg-neutral-200 px-4 text-slate-100 shadow">
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
            <Link href="/keygen">Key Generation</Link>
          </Button>
        </div>
      </div>
      <div className="mt-14 flex min-h-[calc(100vh-3.5rem)] flex-col px-4 py-8">
        {children}
      </div>
    </>
  );
}
