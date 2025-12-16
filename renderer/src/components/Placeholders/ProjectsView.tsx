export function ProjectsView() {
  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            color: 'var(--color-text-primary)',
          }}
        >
          Projects
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px', lineHeight: '1.6' }}>
          Manage your BMAD projects here.
        </p>
        <p
          style={{
            marginTop: '16px',
            fontSize: '14px',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic',
          }}
        >
          Coming soon...
        </p>
      </div>
    </div>
  );
}
