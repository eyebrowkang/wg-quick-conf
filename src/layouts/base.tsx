export function BaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-14 flex min-h-[calc(100vh-3.5rem)] flex-col px-4 py-8">
      {children}
    </div>
  );
}
