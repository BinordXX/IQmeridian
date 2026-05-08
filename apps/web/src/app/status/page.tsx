export default async function StatusPage() {
  const res = await fetch('http://localhost:3001/health', {
    cache: 'no-store',
  });

  const data = await res.json();

  return (
    <main style={{ padding: '2rem' }}>
      <h1>IQMeridian System Status</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}