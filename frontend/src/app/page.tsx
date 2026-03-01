import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome to DevRhythm</h1>
      <p>Your coding progress tracker.</p>
      <nav>
        <ul>
          <li><Link href="/login">Login</Link></li>
          <li><Link href="/dashboard">Dashboard</Link></li>
        </ul>
      </nav>
    </main>
  );
}