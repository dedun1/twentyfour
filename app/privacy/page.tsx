import { SUPPORT_WHATSAPP } from '@/lib/constants';

export default function PrivacyPage() {
  const today = new Date().toLocaleDateString('en-CA');

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {today}</p>
      <h2>What we collect</h2>
      <p>When you use TwentyFour, we collect: account information (email, phone, business details you provide), usage data (how you use our platform), and content you share with us (messages, files, customer data you authorize us to process).</p>
      <h2>How we use it</h2>
      <p>We use this data to provide our services, improve our platform, and communicate with you. We never sell your data to third parties.</p>
      <h2>How we protect it</h2>
      <p>All data is encrypted in transit and at rest. We use Supabase (with row-level security) and industry-standard practices to keep your information safe.</p>
      <h2>Your rights</h2>
      <p>You can request a copy of your data, ask for corrections, or request deletion at any time by contacting us at {SUPPORT_WHATSAPP} or via the platform.</p>
      <h2>Third-party services</h2>
      <p>We use the following third-party services: Supabase (database), Anthropic (AI), Stripe (payments), and WhatsApp Business API (messaging). Each has its own privacy practices.</p>
      <h2>Contact</h2>
      <p>Questions? Reach us on WhatsApp at {SUPPORT_WHATSAPP}.</p>
      <p>Note: This is a starter privacy policy. For specific regional compliance (GDPR, CCPA, HIPAA), additional terms apply - ask us about your specific situation.</p>
    </main>
  );
}

