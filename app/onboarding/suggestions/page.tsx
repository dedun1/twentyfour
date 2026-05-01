import { redirect } from 'next/navigation';

export default async function SuggestionsPage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  const sessionId = searchParams.session;
  if (!sessionId) redirect('/get-started');
  redirect(`/get-started/recommendations?session=${encodeURIComponent(sessionId)}`);
}

