'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookCallButton } from '@/components/layout/BookCallButton';
import { Hero } from '@/components/landing/Hero';
import { TrustStrip } from '@/components/landing/TrustStrip';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ProofSection } from '@/components/landing/ProofSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { VerticalsSection } from '@/components/landing/VerticalsSection';
import { UrgencyBanner } from '@/components/landing/UrgencyBanner';
import { PricingTeaser } from '@/components/landing/PricingTeaser';
import { FounderNote } from '@/components/landing/FounderNote';
import { FinalCTA } from '@/components/landing/FinalCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <TrustStrip />
        <ProblemSection />
        <ProofSection />
        <SolutionSection />
        <HowItWorks />
        <VerticalsSection />
        <UrgencyBanner />
        <PricingTeaser />
        <FounderNote />
        <FinalCTA />
      </main>
      <Footer />
      <BookCallButton />
    </div>
  );
}

