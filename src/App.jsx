import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';

const App = () => {
  const [vista, setVista] = useState('Calendario');
  const [fechaVisualizacion, setFechaVisualizacion] = useState(new Date());
  const [misColores, setMisColores] = useState(() => {
    const c = localStorage.getItem('custodia_colores');
    return c ? JSON.parse(c) : { con: '#76B852', sin: '#FFFFFF' };
  });
  const [cicloPersonalizado, setCicloPersonalizado] = useState(() => {
    const g = localStorage.getItem('custodia_ciclo');
    return g ? JSON.parse(g) : [true,true,true,true,true,true,true,false,false,false,false,false,false,false];
  });
  const [inicioCicloStr, setInicioCicloStr] = useState(() => {
    return localStorage.getItem('custodia_inicio_ciclo') || '2026-01-26';
  });
  const [excepciones, setExcepciones] = useState(() => {
    const g = localStorage.getItem('custodia_notas');
    return g ? JSON.parse(g) : {};
  });
  const [vacaciones, setVacaciones] = useState(() => {
    const g = localStorage.getItem('custodia_vacaciones');
    return g ? JSON.parse(g) : [];
  });
  const [convenio, setConvenio] = useState(() => {
    const saved = localStorage.getItem('custodia_convenio_reglas');
    return saved ? JSON.parse(saved) : { ss_par: 'con', julio_par: 'con', agosto_par: 'sin', navidad_par: 'con' };
  });
  
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const calendarRef = useRef(null);
  const hoy = new Date();
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  useEffect(() => {
    localStorage.setItem('custodia_ciclo', JSON.stringify(cicloPersonalizado));
    localStorage.setItem('custodia_inicio_ciclo', inicioCicloStr);
    localStorage.setItem('custodia_notas', JSON.stringify(excepciones));
    localStorage.setItem('custodia_vacaciones', JSON.stringify(vacaciones));
    localStorage.setItem('custodia_colores', JSON.stringify(misColores));
    localStorage.setItem('custodia_convenio_reglas', JSON.stringify(convenio));
  }, [cicloPersonalizado, inicioCicloStr, excepciones, vacaciones, misColores, convenio]);

  const getTextoParaFondo = (hex) => {
    if (!hex) return '#2D408F';
    const r = parseInt(hex.substring(1, 3), 16) || 0;
    const g = parseInt(hex.substring(3, 5), 16) || 0;
    const b = parseInt(hex.substring(5, 7), 16) || 0;
    return (((r * 299) + (g * 587) + (b * 114)) / 1000) >= 180 ? '#2D408F' : '#FFFFFF';
  };

  const getEstadoDia = (f) => {
    const ft = new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
    for (let v of vacaciones) {
      if (ft >= new Date(v.inicio).getTime() && ft <= new Date(v.fin).getTime()) return v.tipo === 'con';
    }
    const id = f.toDateString();
    if (excepciones[id]?.estado) return excepciones[id].estado === 'con';
    const ref = new Date(inicioCicloStr); 
    const dias = Math.floor((f.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
    let pos = dias % 14;
    if (pos < 0) pos += 14;
    return cicloPersonalizado[pos];
  };

  const getCeldas = (any, mes) => {
    const p = new Date(any, mes, 1).getDay();
    const inicio = p === 0 ? 6 : p - 1;
    const total = new Date(any, mes + 1, 0).getDate();
    const res = [];
    for (let i = inicio; i > 0; i--) res.push({ d: new Date(any, mes, 0).getDate() - i + 1, m: -1, f: new Date(any, mes - 1, new Date(any, mes, 0).getDate() - i + 1) });
    for (let i = 1; i <= total; i++) res.push({ d: i, m: 0, f: new Date(any, mes, i) });
    while (res.length % 7 !== 0) res.push({ d: (res.length % 7) + 1, m: 1, f: new Date(any, mes + 1, (res.length % 7) + 1) });
    return res;
  };

  const estiloBtnDefinitivo = (seccion, valorBoton, tipoColor, label) => {
    const bg = tipoColor === 'con' ? misColores.con : misColores.sin;
    const activo = convenio[seccion] === valorBoton;
    return (
      <button 
        onClick={() => setConvenio({...convenio, [seccion]: valorBoton})}
        style={{
          flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: bg, color: getTextoParaFondo(bg),
          border: activo ? '3px solid #2D408F' : (bg.toLowerCase()==='#ffffff'?'1px solid #DDD':'none'),
          fontWeight: activo ? '900' : '600', fontSize: '8px'
        }}>
        {label}
      </button>
    );
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#FFF', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ padding: '8px 10px', borderBottom: '1px solid #EEE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/image2.png" alt="Logo" style={{ width: '40px' }} />
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '900', color: 'red', margin: 0 }}>CustodiApp (V34)</h1>
              <p style={{ margin: 0, fontSize: '8px', color: '#5F6368' }}>PRUEBA DE CARGA</p>
            </div>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
          {['Calendario', 'Año', 'Vacac.', 'Ajustes'].map(v => (
            <button key={v} onClick={() => setVista(v)} style={{ flex: 1, height: '30px', fontSize: '9px', fontWeight: '900', backgroundColor: vista === v ? '#2D408F' : '#F8F9FA', color: vista === v ? '#FFF' : '#2D408F', border: 'none', borderRadius: '5px' }}>{v.toUpperCase()}</button>
          ))}
        </nav>
      </header>

      <main style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
        {vista === 'Calendario' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
              {getCeldas(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth()).map((c, i) => {
                const bg = c.m === 0 ? (getEstadoDia(c.f) ? misColores.con : misColores.sin) : '#EEE';
                return <div key={i} style={{ aspectRatio: '1/1', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '14px', fontWeight: '900', color: getTextoParaFondo(bg) }}>{c.d}</div>
              })}
            </div>
        )}

        {vista === 'Ajustes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ border: '2px solid #2D408F', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ background: '#2D408F', color: '#FFF', padding: '8px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>CONVENIO PARES</div>
              {['ss', 'julio', 'agosto'].map(sec => (
                <div key={sec} style={{ borderBottom: '1px solid #EEE' }}>
                  <div onClick={() => setSeccionAbierta(seccionAbierta === sec ? null : sec)} style={{ padding: '10px', background: '#F8F9FA', fontSize: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    {sec === 'ss' ? 'SEMANA SANTA' : sec.toUpperCase()} <span>{seccionAbierta === sec ? '−' : '+'}</span>
                  </div>
                  {seccionAbierta === sec && (
                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {estiloBtnDefinitivo(`${sec}_par`, 'con', 'con', sec==='ss'?'ENTERA CON':'1ª QUINC. CON')}
                        {estiloBtnDefinitivo(`${sec}_par`, 'sin', 'sin', sec==='ss'?'ENTERA SIN':'1ª QUINC. SIN')}
                      </div>
                      {sec === 'ss' && (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          {estiloBtnDefinitivo('ss_par', 'mitad_con', 'con', '1ª MITAD CON')}
                          {estiloBtnDefinitivo('ss_par', 'mitad_sin', 'sin', '1ª MITAD SIN')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

