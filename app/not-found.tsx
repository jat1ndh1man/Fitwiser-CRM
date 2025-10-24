export default function NotFound() {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>404</h1>
          <p>Page Not Found</p>
          <a href="/" style={{ marginTop: '20px', color: 'blue' }}>Go Home</a>
        </div>
      </body>
    </html>
  )
}