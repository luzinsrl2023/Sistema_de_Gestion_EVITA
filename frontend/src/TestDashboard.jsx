import React from 'react'

export default function TestDashboard() {
  console.log('🎯 TestDashboard component is rendering')

  return (
    <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px' }}>
        Test Dashboard - Funcionando!
      </h1>
      <div style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px' }}>
        <p style={{ color: '#d1d5db' }}>
          ✅ Si puedes ver este mensaje, el componente se está renderizando correctamente.
        </p>
        <p style={{ color: '#d1d5db', marginTop: '8px' }}>
          🔧 El problema anterior estaba en las clases dinámicas de Tailwind o en el lazy loading.
        </p>
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ color: '#4ade80', fontWeight: '600' }}>Test Card 1</h3>
            <p style={{ color: '#d1d5db' }}>Contenido de prueba funcionando</p>
          </div>
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ color: '#60a5fa', fontWeight: '600' }}>Test Card 2</h3>
            <p style={{ color: '#d1d5db' }}>Contenido de prueba funcionando</p>
          </div>
        </div>
      </div>
    </div>
  )
}
