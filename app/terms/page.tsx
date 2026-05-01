import { SUPPORT_WHATSAPP } from '@/lib/constants';

export default function TermsPage() {
  const today = new Date().toLocaleDateString('en-CA');

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {today}</p>
      <h2>Acceptance</h2>
      <p>By using TwentyFour, you agree to these terms.</p>
      <h2>Service description</h2>
      <p>TwentyFour provides AI automation tools for businesses. We build custom workflows, AI agents, and integrations for our clients.</p>
      <h2>Your obligations</h2>
      <p>You agree to: provide accurate information, comply with applicable laws, not misuse our services for spam or illegal activity, and pay your subscription on time.</p>
      <h2>Our obligations</h2>
      <p>We agree to: provide the services described in your plan, protect your data per our Privacy Policy, give you reasonable notice before significant changes, and refund you if we fail to deliver what was agreed in your consultation.</p>
      <h2>Subscription and billing</h2>
      <p>Plans are billed monthly. You can cancel anytime - cancellation takes effect at the end of the current billing period. No partial refunds for unused time except in cases of service failure.</p>
      <h2>Termination</h2>
      <p>We may terminate or suspend service for violations of these terms. You may terminate at any time.</p>
      <h2>Limitation of liability</h2>
      <p>Our total liability is limited to the amount you have paid us in the past 12 months.</p>
      <h2>Changes</h2>
      <p>We may update these terms; we will notify you by email of material changes.</p>
      <h2>Contact</h2>
      <p>Questions? Reach us on WhatsApp at {SUPPORT_WHATSAPP}.</p>
    </main>
  );
}

