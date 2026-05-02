import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'sonner';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'TwentyFour — AI automation for US businesses',
  description:
    'Personalized automation plans for US service businesses, e-commerce, and clinics. Save time, recover lost revenue, and scale without hiring.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster
              richColors
              position="top-center"
              toastOptions={{
                style: {
                  background: 'var(--card)',
                  border: '1px solid rgba(240,165,0,0.2)',
                  color: 'var(--foreground)',
                },
              }}
            />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
