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
    <>
      <Hero />
      <TrustStrip />
      <div className="section-divider" />
      <ProblemSection />
      <div className="section-divider" />
      <ProofSection />
      <SolutionSection />
      <div className="section-divider" />
      <HowItWorks />
      <VerticalsSection />
      <UrgencyBanner />
      <div className="section-divider" />
      <PricingTeaser />
      <FounderNote />
      <FinalCTA />
      <Footer />
      <BookCallButton />
    </>
  );
}
