"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold' }}>Error</h1>
          <p>Application Error</p>
          <button onClick={reset} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}