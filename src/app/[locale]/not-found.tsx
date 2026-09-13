import Link from "next/link";
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ padding: '2rem', maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '8rem', marginBottom: '1rem' }}>🤷‍♀️</div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Page Not Found
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            The page you are looking for does not exist.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link href="/" style={{ padding: '0.75rem', backgroundColor: '#000', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
