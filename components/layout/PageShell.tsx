import { headers } from 'next/headers';
import { Navbar } from '@/components/layout/Navbar';

const HIDE_NAVBAR_PATTERNS = [
  /^\/login(\/|$)/,
  /^\/register(\/|$)/,
  /^\/dashboard(\/|$)/,
  /^\/admin(\/|$)/,
];

export async function PageShell({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const hideNavbar = HIDE_NAVBAR_PATTERNS.some((pattern) => pattern.test(pathname));

  if (hideNavbar) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="pt-16">{children}</div>
    </>
  );
}
