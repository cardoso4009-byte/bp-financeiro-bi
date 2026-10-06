export default function AccessDeniedPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Arial, sans-serif', background: '#f4f7fb' }}>
      <section style={{ maxWidth: 520, padding: 32, borderRadius: 16, background: '#fff', border: '1px solid #dbe5ef', boxShadow: '0 10px 30px rgba(15, 39, 65, 0.08)' }}>
        <small style={{ color: '#5d7690', letterSpacing: '.08em', textTransform: 'uppercase' }}>BP Financeiro</small>
        <h1 style={{ margin: '10px 0', color: '#122b45' }}>Acesso não autorizado</h1>
        <p style={{ color: '#5d6f82', lineHeight: 1.6 }}>
          Seu perfil não possui a permissão necessária para acessar esta área.
        </p>
        <a href="/" style={{ display: 'inline-block', marginTop: 12, padding: '10px 16px', borderRadius: 8, background: '#123f6d', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>
          Voltar
        </a>
      </section>
    </main>
  )
}
