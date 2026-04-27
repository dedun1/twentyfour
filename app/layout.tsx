import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from 'sonner';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'TwentyFour. أتمتة الأعمال',
  description: 'منصة أتمتة مخصصة للأعمال. توفر وقتك وتزيد إيراداتك',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
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
