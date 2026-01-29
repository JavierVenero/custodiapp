import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';

const App = () => {
  const [vista, setVista] = useState('Calendario');
  const [fechaVisualizacion, setFechaVisualizacion] = useState(new Date());
  const [fechaConsulta, setFechaConsulta] = useState('');
  
  // PALETA DE COLORES PERSONALIZABLE
  const [misColores, setMisColores] = useState(() => {
    const c = localStorage.getItem('custodia_colores');
    return c ? JSON.parse(c) : { con: '#76B852', sin: '#FFFFFF', textoSin: '#2D408F' };
  });

  const [cicloPersonalizado, setCicloPersonalizado] = useState(() => {
    const g = localStorage.getItem('custodia_ciclo');
    return g ? JSON.parse(g) : [true,true,true,true,true,true,true,false,false,false,false,false,false,false];
  });

  const [excepciones, setExcepciones] = useState(() => {
    const g = localStorage.getItem('custodia_notas');
    return g ? JSON.parse(g) : {};
  });

  const [vacaciones, setVacaciones] = useState(() => {
    const g = localStorage.getItem('custodia_vacaciones');
    return g ? JSON.parse(g) : [];
  });
  
  const hoyISO = new Date().toISOString().split('T')[0];
  const [vacaInicio, setVacaInicio] = useState(hoyISO);
  const [vacaFin, setVacaFin] = useState(hoyISO);
  const [vacaTipo, setVacaTipo] = useState('con');
  
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [textoExcepcion, setTextoExcepcion] = useState('');
  
  const calendarRef = useRef(null);
  const hoy = new Date();
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  useEffect(() => {
    localStorage.setItem('custodia_ciclo', JSON.stringify(cicloPersonalizado));
    localStorage.setItem('custodia_notas', JSON.stringify(excepciones));
    localStorage.setItem('custodia_vacaciones', JSON.stringify(vacaciones));
    localStorage.setItem('custodia_colores', JSON.stringify(misColores));
  }, [cicloPersonalizado, excepciones, vacaciones, misColores]);

  const esFechaEnVacaciones = (f) => {
    const ft = new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
    for (let v of vacaciones) {
      if (ft >= new Date(v.inicio).getTime() && ft <= new Date(v.fin).getTime()) return v.tipo === 'con';
    }
    return null;
  };

  const tieneCustodiaOriginal = (f) => {
    const ref = new Date(2026, 0, 1);
    const dias = Math.floor((f.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
    let pos = dias % 14;
    if (pos < 0) pos += 14;
    return cicloPersonalizado[pos];
  };

  const getEstadoDia = (f) => {
    const vaca = esFechaEnVacaciones(f);
    if (vaca !== null) return vaca;
    const id = f.toDateString();
    if (excepciones[id]?.estado) return excepciones[id].estado === 'con';
    return tieneCustodiaOriginal(f);
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

  const capturar = () => {
    if (!calendarRef.current) return;
    toPng(calendarRef.current, { cacheBust: true, filter: (n) => n.tagName !== 'BUTTON' })
      .then((url) => { const a = document.createElement('a'); a.download = 'CustodiApp.png'; a.href = url; a.click(); });
  };

  const abrirEditor = (id) => {
    setDiaSeleccionado(id);
    setTextoExcepcion(excepciones[id]?.nota || '');
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#FFF', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <header style={{ padding: '8px 10px', borderBottom: '1px solid #EEE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/image2.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '5px' }} />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#2D408F', margin: 0 }}>CustodiApp V4</h1>
              <p style={{ margin: 0, fontSize: '9px', color: '#5F6368', fontWeight: '800' }}>GESTIÓN FAMILIAR</p>
            </div>
          </div>
          <button onClick={capturar} style={{ fontSize: '18px', background: '#F8F9FA', border: '1px solid #DDD', borderRadius: '50%', width: '36px', height: '36px' }}>📸</button>
        </div>
        
        <nav style={{ display: 'flex', gap: '2px', justifyContent: 'space-between', alignItems: 'center' }}>
          {['Calendario', 'Año', 'Vacac.', 'Excep.', 'Ajustes'].map(v => (
            <button key={v} onClick={() => setVista(v === 'Ajustes' ? 'Ajustes' : v)} style={{ flex: v === 'Calendario' ? 2 : 1, height: '32px', fontSize: v === 'Ajustes' ? '24px' : (v === 'Calendario' ? '10px' : '9px'), fontWeight: '900', borderRadius: '6px', border: 'none', backgroundColor: vista === v ? '#2D408F' : '#F8F9FA', color: vista === v ? '#FFF' : '#2D408F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {v === 'Ajustes' ? '⚙️' : v.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <main ref={calendarRef} style={{ flex: 1, padding: '5px 10px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {vista === 'Calendario' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <button onClick={() => setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth() - 1, 1))} style={{ fontSize: '24px', border: 'none', background: 'none', color: '#2D408F' }}>◀</button>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '900', color: '#2D408F' }}>{new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(fechaVisualizacion).toUpperCase()}</h2>
                <button onClick={() => setFechaVisualizacion(new Date())} style={{ border: 'none', background: 'none', color: '#76B852', fontSize: '11px', fontWeight: '900', textDecoration: 'underline' }}>VOLVER AL DÍA DE HOY</button>
              </div>
              <button onClick={() => setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth() + 1, 1))} style={{ fontSize: '24px', border: 'none', background: 'none', color: '#2D408F' }}>▶</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1, marginBottom: '8px' }}>
              {diasSemana.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#AAA' }}>{d}</div>)}
              {getCeldas(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth()).map((c, i) => {
                const custodial = getEstadoDia(c.f);
                return (
                  <div key={i} onClick={() => abrirEditor(c.f.toDateString())}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', borderRadius: '10px', backgroundColor: custodial ? misColores.con : misColores.sin, color: custodial ? '#FFF' : '#2D408F', border: c.f.toDateString() === hoy.toDateString() ? '3px solid #2D408F' : '1px solid #EEE', position: 'relative' }}>
                    {c.d}
                    {excepciones[c.f.toDateString()] && <div style={{ width: '6px', height: '6px', backgroundColor: '#F5A623', borderRadius: '50%', position: 'absolute', top: '3px', right: '3px', border: '1px solid white' }}></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', paddingBottom: '5px' }}>
              <div style={{ flex: 1, padding: '10px', backgroundColor: misColores.con, color: 'white', borderRadius: '10px', textAlign: 'center', fontWeight: '900', fontSize: '11px' }}>CON NIÑ@S</div>
              <div style={{ flex: 1, padding: '10px', backgroundColor: misColores.sin, color: '#2D408F', borderRadius: '10px', textAlign: 'center', fontWeight: '900', border: '1.5px solid #EEE', fontSize: '11px' }}>SIN NIÑ@S</div>
            </div>
          </>
        )}

        {vista === 'Año' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <button onClick={() => setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear() - 1, 0, 1))} style={{ border: 'none', background: 'none', color: '#2D408F', fontSize: '24px' }}>◀</button>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#2D408F' }}>AÑO {fechaVisualizacion.getFullYear()}</h2>
              <button onClick={() => setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear() + 1, 0, 1))} style={{ border: 'none', background: 'none', color: '#2D408F', fontSize: '24px' }}>▶</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', flex: 1 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ border: '1.2px solid #EEE', borderRadius: '12px', padding: '6px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '9px', margin: '0 0 3px 0', textAlign: 'center', fontWeight: '900', color: '#2D408F' }}>{new Intl.DateTimeFormat('es', { month: 'short' }).format(new Date(fechaVisualizacion.getFullYear(), i, 1)).toUpperCase()}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1.5px', flex: 1 }}>
                    {getCeldas(fechaVisualizacion.getFullYear(), i).map((c, j) => (
                      <div key={j} onClick={() => abrirEditor(c.f.toDateString())} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: '800', backgroundColor: c.m === 0 ? (getEstadoDia(c.f) ? misColores.con : misColores.sin) : 'transparent', color: c.m === 0 ? (getEstadoDia(c.f) ? '#FFF' : '#2D408F') : '#EEE' }}>{c.d}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vista === 'Vacac.' && (
          <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#2D408F', marginBottom: '15px' }}>VACACIONES</h2>
            <div style={{ backgroundColor: '#F8F9FA', padding: '15px', borderRadius: '15px', border: '1px solid #EEE', marginBottom: '15px' }}>
              <input type="date" value={vacaInicio} onChange={e => setVacaInicio(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '12px', borderRadius: '10px', border: '1px solid #DDD' }} />
              <input type="date" value={vacaFin} onChange={e => setVacaFin(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '12px', borderRadius: '10px', border: '1px solid #DDD' }} />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <button onClick={() => setVacaTipo('con')} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: misColores.con, color: '#FFF', border: 'none', fontWeight: '900' }}>CON NIÑ@S</button>
                <button onClick={() => setVacaTipo('sin')} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: misColores.sin, color: '#2D408F', border: '2px solid #EEE', fontWeight: '900' }}>SIN NIÑ@S</button>
              </div>
              <button onClick={() => { if(vacaInicio && vacaFin) setVacaciones([...vacaciones, {inicio:vacaInicio, fin:vacaFin, tipo:vacaTipo}]); }} style={{ width: '100%', padding: '15px', backgroundColor: '#2D408F', color: '#FFF', borderRadius: '12px', fontWeight: '900' }}>GUARDAR</button>
            </div>
            {vacaciones.map((v, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: v.tipo === 'con' ? '#E9F5E1' : '#E8EAF6', borderRadius: '10px', marginBottom: '8px', borderLeft: `5px solid ${v.tipo === 'con' ? misColores.con : '#2D408F'}` }}>
                <span style={{ fontSize: '12px', fontWeight: '700' }}>{new Date(v.inicio).toLocaleDateString('es-ES')} al {new Date(v.fin).toLocaleDateString('es-ES')}</span>
                <button onClick={() => setVacaciones(vacaciones.filter((_, i) => i !== idx))} style={{ color: 'red', border: 'none', background: 'none', fontWeight: '900', fontSize: '18px' }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {vista === 'Excep.' && (
          <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#2D408F', marginBottom: '15px' }}>EXCEPCIONES</h2>
            <div style={{ backgroundColor: '#F8F9FA', padding: '15px', borderRadius: '15px', border: '1px solid #EEE', marginBottom: '20px' }}>
              <input type="date" id="fechaEx" defaultValue={hoyISO} style={{ width: '100%', marginBottom: '10px', padding: '12px', borderRadius: '10px', border: '1px solid #DDD' }} />
              <textarea id="notaEx" placeholder="Nota..." style={{ width: '100%', height: '60px', borderRadius: '10px', border: '1px solid #DDD', padding: '10px', marginBottom: '10px', fontSize: '14px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => {
                  const f = new Date(document.getElementById('fechaEx').value).toDateString();
                  setExcepciones({...excepciones, [f]: { nota: document.getElementById('notaEx').value, estado: 'con' }});
                  document.getElementById('notaEx').value = '';
                }} style={{ flex: 1, padding: '12px', background: misColores.con, color: '#FFF', borderRadius: '10px', border: 'none', fontWeight: '900', fontSize: '10px' }}>AÑADIR CON NIÑ@S</button>
                <button onClick={() => {
                  const f = new Date(document.getElementById('fechaEx').value).toDateString();
                  setExcepciones({...excepciones, [f]: { nota: document.getElementById('notaEx').value, estado: 'sin' }});
                  document.getElementById('notaEx').value = '';
                }} style={{ flex: 1, padding: '12px', background: misColores.sin, color: '#2D408F', border: '2px solid #DADCE0', borderRadius: '10px', fontWeight: '900', fontSize: '10px' }}>AÑADIR SIN NIÑ@S</button>
              </div>
            </div>
            {Object.keys(excepciones).sort((a,b) => new Date(b)-new Date(a)).map(id => (
              <div key={id} style={{ padding: '15px', backgroundColor: '#F8F9FA', borderRadius: '15px', marginBottom: '10px', borderLeft: `6px solid ${excepciones[id].estado === 'con' ? misColores.con : '#2D408F'}`, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#2D408F', fontWeight: '900' }}>{new Date(id).toLocaleDateString('es-ES')}</span>
                  <button onClick={() => { const n = {...excepciones}; delete n[id]; setExcepciones(n); }} style={{ color: 'red', border: 'none', background: 'none', fontWeight: '900', fontSize: '18px' }}>✕</button>
                </div>
                <div style={{ fontSize: '10px', fontWeight: '800', color: excepciones[id].estado === 'con' ? misColores.con : '#2D408F' }}>{excepciones[id].estado === 'con' ? 'CON NIÑ@S' : 'SIN NIÑ@S'}</div>
                {excepciones[id].nota && <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '5px' }}>"{excepciones[id].nota}"</div>}
              </div>
            ))}
          </div>
        )}

        {vista === 'Ajustes' && (
          <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#2D408F', marginBottom: '15px' }}>CONFIGURACIÓN CICLO</h2>
            <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>Toca los días para cambiar:</p>
            
            {/* GRID DE DÍAS - AHORA CON DIVS, NO BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', backgroundColor: '#F8F9FA', padding: '15px', borderRadius: '20px', border: '1px solid #EEE', marginBottom: '20px' }}>
              {cicloPersonalizado.map((esCon, i) => (
                <div 
                  key={i} 
                  onClick={() => { const n = [...cicloPersonalizado]; n[i] = !n[i]; setCicloPersonalizado(n); }} 
                  style={{ 
                    height: '55px', 
                    borderRadius: '12px', 
                    backgroundColor: esCon ? misColores.con : misColores.sin, 
                    color: esCon ? '#FFF' : '#2D408F', 
                    border: '1px solid #DDD',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                  <span style={{ fontSize: '16px', fontWeight: '900' }}>{i+1}</span>
                  <span style={{ fontSize: '8px', fontWeight: '800', marginTop: '2px' }}>{esCon ? 'CON' : 'SIN'}</span>
                </div>
              ))}
            </div>

            {/* SELECCIÓN DE COLORES */}
            <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#5F6368', marginBottom: '10px' }}>PERSONALIZAR COLORES</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
              
              {/* Selector CON NIÑ@S */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F8F9FA', padding: '15px', borderRadius: '12px', border: '1px solid #EEE' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: misColores.con, border: '2px solid #ddd', overflow: 'hidden' }}>
                  <input type="color" value={misColores.con} onChange={(e) => setMisColores({...misColores, con: e.target.value})} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#2D408F' }}>CON NIÑ@S</span>
              </div>

              {/* Selector SIN NIÑ@S */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F8F9FA', padding: '15px', borderRadius: '12px', border: '1px solid #EEE' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: misColores.sin, border: '2px solid #ddd', overflow: 'hidden' }}>
                  <input type="color" value={misColores.sin} onChange={(e) => setMisColores({...misColores, sin: e.target.value})} style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: '900', color: '#2D408F' }}>SIN NIÑ@S</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#E8EAF6', padding: '20px', borderRadius: '15px', border: '2px solid #2D408F', boxShadow: '0 4px 10px rgba(45, 64, 143, 0.15)' }}>
               <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#2D408F', marginBottom: '10px', textAlign: 'center' }}>CONVENIO REGULADOR</h3>
               <button onClick={() => {
                const c2026 = [
                  { inicio: '2026-03-27', fin: '2026-04-05', tipo: 'con' },
                  { inicio: '2026-07-01', fin: '2026-07-15', tipo: 'con' },
                  { inicio: '2026-08-01', fin: '2026-08-15', tipo: 'con' }
                ];
                setVacaciones(c2026);
                alert("Convenio Estándar Aplicado");
               }} style={{ width: '100%', padding: '16px', backgroundColor: '#2D408F', color: '#FFF', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>APLICAR CONVENIO ESTÁNDAR DE CUSTODIA COMPARTIDA</button>
            </div>
          </div>
        )}
      </main>

      {diaSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45, 64, 143, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '25px', borderRadius: '25px', width: '85%', maxWidth: '350px' }}>
            <p style={{ textAlign: 'center', fontWeight: '900', color: '#2D408F', fontSize: '18px', marginBottom: '20px' }}>{new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(diaSeleccionado))}</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => { setExcepciones({...excepciones, [diaSeleccionado]: { nota: textoExcepcion, estado: 'con' }}); setDiaSeleccionado(null); }} style={{ flex: 1, padding: '18px', background: misColores.con, color: '#FFF', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '10px' }}>CON NIÑ@S</button>
              <button onClick={() => { setExcepciones({...excepciones, [diaSeleccionado]: { nota: textoExcepcion, estado: 'sin' }}); setDiaSeleccionado(null); }} style={{ flex: 1, padding: '18px', background: misColores.sin, color: '#2D408F', border: '2px solid #DADCE0', borderRadius: '15px', fontWeight: '900', fontSize: '10px' }}>SIN NIÑ@S</button>
            </div>
            <textarea value={textoExcepcion} onChange={e => setTextoExcepcion(e.target.value)} placeholder="Nota..." style={{ width: '100%', height: '80px', borderRadius: '12px', border: '1px solid #DDD', padding: '15px', fontSize: '16px', outline: 'none' }} />
            <button onClick={() => setDiaSeleccionado(null)} style={{ width: '100%', marginTop: '10px', padding: '15px', background: '#2D408F', color: '#FFF', borderRadius: '15px', border: 'none', fontWeight: '900' }}>CERRAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;