import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/pl');
}

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'
