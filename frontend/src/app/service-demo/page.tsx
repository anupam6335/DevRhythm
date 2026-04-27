import { Suspense } from 'react';
import styles from './page.module.css';
import ClientWrapper from './ClientWrapper';

// Reusable skeleton
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </div>
  );
}

// Server Component – fetches data on the server
async function ServerUsers() {
  const { getUsers } = await import('@/features/user/services/userServiceTemp');

  try {
    const users = await getUsers();
    return (
      <Card title=" Server-side fetch">
        <p className={styles.desc}>
          This data was fetched <strong>on the server</strong> at request time.
          The HTML is fully rendered and sent to the browser.
        </p>
        <ul className={styles.list}>
          {users.slice(0, 5).map(user => (
            <li key={user.id}>{user.name} ({user.email})</li>
          ))}
        </ul>
      </Card>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return (
      <Card title=" Server-side fetch">
        <p className={styles.error}>Error: {message}</p>
      </Card>
    );
  }
}

// Main page (Server Component)
export default function ServiceDemoPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.mainTitle}>Next.js Service Layers &amp; Error Handling</h1>

      <div className={styles.grid}>
        <Suspense fallback={<Card title="Server-side fetch"><p>Loading…</p></Card>}>
          <ServerUsers />
        </Suspense>

        <ClientWrapper />
      </div>

      {/* Decision guide */}
      <section className={styles.guide}>
        <h2>When to use server vs. client?</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Criteria</th>
              <th>Server</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SEO / initial load</td>
              <td>✅ Better</td>
              <td>❌ Slower</td>
            </tr>
            <tr>
              <td>User-specific data</td>
              <td>🟡 Needs cookies/headers</td>
              <td>✅ Natural fit</td>
            </tr>
            <tr>
              <td>Interactive state</td>
              <td>❌ Complex</td>
              <td>✅ Easy</td>
            </tr>
            <tr>
              <td>Security (hide tokens)</td>
              <td>✅ Safe</td>
              <td>❌ Risky</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}