"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>500</h1>
          <p>Something went wrong</p>
          <button onClick={reset} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}