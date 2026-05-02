import Link from 'next/link';
import { Zap } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { getNavAuthState } from '@/lib/auth-state';
import { UserMenu } from './UserMenu';
import { NavbarMobile } from './NavbarMobile';
import { NavLinks } from './NavLinks';
import { NavbarScrollWrapper } from './NavbarScrollWrapper';

export async function Navbar() {
  const auth = await getNavAuthState();

  return (
    <NavbarScrollWrapper>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold text-primary">TwentyFour</span>
        </Link>

        {/* Desktop nav links — context-aware */}
        <div className="hidden items-center gap-6 md:flex">
          <NavLinks />
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          {auth.isAuthenticated ? (
            <UserMenu displayName={auth.displayName} email={auth.email} isAdmin={auth.isAdmin} />
          ) : (
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
              <span>Sign in</span>
            </Button>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <NavbarMobile auth={auth} />
        </div>
    </NavbarScrollWrapper>
  );
}
