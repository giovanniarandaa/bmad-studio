export function FeaturesView() {
  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            color: '#1F2937',
          }}
        >
          Features
        </h1>
        <p style={{ color: '#6B7280', fontSize: '16px', lineHeight: '1.6' }}>
          Browse and manage features within your projects.
        </p>
        <p
          style={{
            marginTop: '16px',
            fontSize: '14px',
            color: '#9CA3AF',
            fontStyle: 'italic',
          }}
        >
          Coming soon...
        </p>
      </div>
    </div>
  );
}
