import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

// Prevent search engines from indexing this redirect page
export const metadata: Metadata = {
  robots: 'noindex, nofollow',
};

export default function UserListRedirect() {
  redirect('/users');
}