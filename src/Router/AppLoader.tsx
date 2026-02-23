export const AppLoader: React.FC = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0b1220 0%, #1a2b5c 55%, #0b1220 100%)',
  }}>
    <svg
      style={{ animation: 'spin 0.8s linear infinite', color: '#f97316' }}
      width="36" height="36" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  </div>
);