import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';

const App = () => {
  const [vista, setVista] = useState('Calendario');
  const [fechaVisualizacion, setFechaVisualizacion] = useState(new Date());
  
  // --- COLORES ---
  const [misColores, setMisColores] = useState(() => {
    const c = localStorage.getItem('custodia_colores');
    return c ? JSON.parse(c) : { con: '#76B852', sin: '#FFFFFF' };
  });

  // --- CICLO BASE ---
  const [cicloPersonalizado, setCicloPersonalizado] = useState(() => {
    const g = localStorage.getItem('custodia_ciclo');
    return g ? JSON.parse(g) : [true,true,true,true,true,true,true,false,false,false,false,false,false,false];
  });

  // --- FECHA INICIO ---
  const [inicioCicloStr, setInicioCicloStr] = useState(() => {
    return localStorage.getItem('custodia_inicio_ciclo') || '2026-01-26';
  });

  // --- DATOS ---
  const [excepciones, setExcepciones] = useState(() => {
    const g = localStorage.getItem('custodia_notas');
    return g ? JSON.parse(g) : {};
  });
  const [vacaciones, setVacaciones] = useState(() => {
    const g = localStorage.getItem('custodia_vacaciones');
    return g ? JSON.parse(g) : [];
  });

  // --- CONVENIO ---
  const [convenio, setConvenio] = useState(() => {
    const saved = localStorage.getItem('custodia_convenio_reglas');
    return saved ? JSON.parse(saved) : {
      ss_par: 'con',       
      julio_par: 'con',    
      agosto_par: 'sin',   
      navidad_par: 'con'   
    };
  });
  
  const hoyISO = new Date().toISOString().split('T')[0];
  const [vacaInicio, setVacaInicio] = useState(hoyISO);
  const [vacaFin, setVacaFin] = useState(hoyISO);
  const [vacaTipo, setVacaTipo] = useState('con');
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [textoExcepcion, setTextoExcepcion] = useState('');
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

  // --- HELPER: CONTRASTE ---
  const getTextoParaFondo = (hex) => {
    if (!hex) return '#2D408F';
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return '#2D408F'; 
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 180) ? '#2D408F' : '#FFFFFF';
  };

  // --- LÓGICA FECHAS ---
  const esFechaEnVacaciones = (f) => {
    const ft = new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime();
    for (let v of vacaciones) {
      if (ft >= new Date(v.inicio).getTime() && ft <= new Date(v.fin).getTime()) return v.tipo === 'con';
    }
    return null;
  };

  const tieneCustodiaOriginal = (f) => {
    const ref = new Date(inicioCicloStr); 
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
    toPng(calendarRef.current, { cacheBust: true, filter: (n) => n.tagName !== 'BUTTON' && !n.classList?.contains('no-capture') })
      .then((url) => { const a = document.createElement('a'); a.download = 'CustodiApp.png'; a.href = url; a.click(); });
  };

  const abrirEditor = (id) => {
    setDiaSeleccionado(id);
    setTextoExcepcion(excepciones[id]?.nota || '');
  };

  const toggleSeccion = (sec) => {
    if (seccionAbierta === sec) setSeccionAbierta(null);
    else setSeccionAbierta(sec);
  };

  // --- LÓGICA BOTONES ---
  const estiloBtnDirecto = (activo, tipo) => {
    const colorFondo = tipo === 'con' ? misColores.con : misColores.sin;
    const bg = colorFondo;
    const txt = getTextoParaFondo(bg);
    let border = '1px solid #DDD';
    let boxShadow = 'none';
    let fontWeight = '700';
    if (activo) {
        border = '3px solid #2D408F'; 
        boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
        fontWeight = '900';
    }
    return {
      flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: bg, color: txt, border: border,
      fontWeight: fontWeight, fontSize: '9px', cursor: 'pointer', boxShadow: boxShadow, transition: 'all 0.15s ease-out'
    };
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#FFF', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <header style={{ padding: '8px 10px', borderBottom: '1px solid #EEE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/image2.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '5px' }} />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#2D408F', margin: 0 }}>CustodiApp</h1>
              <p style={{ margin: 0, fontSize: '9px', color: '#5F6368', fontWeight: '800' }}>GESTIÓN FAMILIAR</p>
            </div>
          </div>
          <button onClick={capturar} style={{ fontSize: '18px', background: '#F8F9FA', border: '1px solid #DDD', borderRadius: '50%', width: '36px', height: '36px' }}>📸</button>
        </div>
        
        <nav style={{ display: 'flex', gap: '2px', justifyContent: 'space-between', alignItems: 'center' }}>
          {['Calendario', 'Año', 'Vacac.', 'Excep.', 'Ajustes'].map(v => (
            <button key={v} onClick={() => setVista(v)} style={{ flex: v === 'Calendario' ? 2 : 1, height: '32px', fontSize: v === 'Ajustes' ? '24px' : (v === 'Calendario' ? '10px' : '9px'), fontWeight: '900', borderRadius: '6px', border: 'none', backgroundColor: vista === v ? '#2D408F' : '#F8F9FA', color: vista === v ? '#FFF' : '#2D408F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {v === 'Ajustes' ? '⚙️' : v.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      {/* MAIN */}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', flex: 1, alignContent: 'center' }}>
              {diasSemana.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#AAA' }}>{d}</div>)}
              {getCeldas(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth()).map((c, i) => {
                const custodial = getEstadoDia(c.f);
                const esDelMes = c.m === 0;
                const bg = esDelMes ? (custodial ? misColores.con : misColores.sin) : 'transparent';
                const txt = getTextoParaFondo(bg);
                const border = c.f.toDateString() === hoy.toDateString() ? '3px solid #2D408F' : '1px solid #EEE';
                return (
                  <div key={i} onClick={() => abrirEditor(c.f.toDateString())}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', fontSize: '18px', fontWeight: '900', borderRadius: '12px', backgroundColor: bg, color: txt, border: border, position: 'relative', opacity: esDelMes ? 1 : 0.3, pointerEvents: esDelMes ? 'auto' : 'none' }}>
                    {c.d}
                    {excepciones[c.f.toDateString()] && <div style={{ width: '6px', height: '6px', backgroundColor: '#F5A623', borderRadius: '50%', position: 'absolute', top: '3px', right: '3px', border: '1px solid white' }}></div>}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingBottom: '10px', marginTop: '10px' }}>
              <div style={{ flex: 1, padding: '12px', backgroundColor: misColores.con, color: getTextoParaFondo(misColores.con), borderRadius: '10px', textAlign: 'center', fontWeight: '900', fontSize: '11px' }}>CON NIÑ@S</div>
              <div style={{ flex: 1, padding: '12px', backgroundColor: misColores.sin, color: getTextoParaFondo(misColores.sin), borderRadius: '10px', textAlign: 'center', fontWeight: '900', border: '1.5px solid #EEE', fontSize: '11px' }}>SIN NIÑ@S</div>
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
                <div key={i} 
                  onClick={() => {
                    setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear(), i, 1));
                    setVista('Calendario');
                  }}
                  style={{ border: '1.2px solid #EEE', borderRadius: '12px', padding: '6px', display: 'flex', flexDirection: 'column', cursor: 'pointer', backgroundColor: '#FDFDFD' }}>
                  <h3 style={{ fontSize: '9px', margin: '0 0 3px 0', textAlign: 'center', fontWeight: '900', color: '#2D408F' }}>{new Intl.DateTimeFormat('es', { month: 'short' }).format(new Date(fechaVisualizacion.getFullYear(), i, 1)).toUpperCase()}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1.5px', flex: 1 }}>
                    {getCeldas(fechaVisualizacion.getFullYear(), i).map((c, j) => {
                      const custodial = getEstadoDia(c.f);
                      const bg = c.m === 0 ? (custodial ? misColores.con : misColores.sin) : 'transparent';
                      const txt = c.m === 0 ? getTextoParaFondo(bg) : '#EEE';
                      return <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontWeight: '800', backgroundColor: bg, color: txt }}>{c.d}</div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {vista === 'Ajustes' && (
          <div style={{ padding: '10px', overflowY: 'auto', flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#2D408F', marginBottom: '10px' }}>CONFIGURACIÓN CICLO</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', backgroundColor: '#F8F9FA', padding: '10px', borderRadius: '15px', border: '1px solid #EEE', marginBottom: '15px' }}>
              {cicloPersonalizado.map((esCon, i) => {
                const bg = esCon ? misColores.con : misColores.sin;
                const txt = getTextoParaFondo(bg);
                const border = (bg.toLowerCase() === '#ffffff' || bg.toLowerCase() === '#fff') ? '1px solid #DDD' : 'none';
                return (
                  <div key={i} onClick={() => { const n = [...cicloPersonalizado]; n[i] = !n[i]; setCicloPersonalizado(n); }} style={{ height: '35px', borderRadius: '8px', backgroundColor: bg, color: txt, border: border, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <span style={{ fontSize: '12px', fontWeight: '900' }}>{i+1}</span>
                    <span style={{ fontSize: '7px', fontWeight: '800' }}>{esCon ? 'CON' : 'SIN'}</span>
                  </div>
                );
              })}
            </div>
            
            <div style={{ backgroundColor: '#FFF', borderRadius: '15px', border: '2px solid #2D408F', overflow: 'hidden' }}>
               <div style={{ backgroundColor: '#2D408F', padding: '10px', textAlign: 'center' }}><h3 style={{ fontSize: '12px', fontWeight: '900', color: '#FFF', margin: 0 }}>📋 CONDICIONES CONVENIO (PARES)</h3></div>
               {['ss', 'julio', 'agosto', 'navidad'].map(sec => (
                 <div key={sec} style={{ borderBottom: '1px solid #EEE' }}>
                   <button onClick={() => toggleSeccion(sec)} style={{ width: '100%', padding: '12px', background: '#F8F9FA', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontWeight: '900', color: '#2D408F', fontSize: '11px' }}>{sec === 'ss' ? 'SEMANA SANTA' : sec.toUpperCase()}</span>
                     <span>{seccionAbierta === sec ? '−' : '+'}</span>
                   </button>
                   {seccionAbierta === sec && (
                     <div style={{ padding: '10px', backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => setConvenio({...convenio, [`${sec}_par`]: 'con'})} style={estiloBtnDirecto(convenio[`${sec}_par`] === 'con', 'con')}>CON NIÑ@S</button>
                          <button onClick={() => setConvenio({...convenio, [`${sec}_par`]: 'sin'})} style={estiloBtnDirecto(convenio[`${sec}_par`] === 'sin', 'sin')}>SIN NIÑ@S</button>
                        </div>
                     </div>
                   )}
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL EXCEPCIÓN */}
      {diaSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(45,64,143,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFF', padding: '25px', borderRadius: '25px', width: '85%', maxWidth: '350px' }}>
            <p style={{ textAlign: 'center', fontWeight: '900', color: '#2D408F', fontSize: '18px', marginBottom: '20px' }}>{new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(new Date(diaSeleccionado))}</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={() => { setExcepciones({...excepciones, [diaSeleccionado]: { nota: textoExcepcion, estado: 'con' }}); setDiaSeleccionado(null); }} style={{ flex: 1, padding: '18px', borderRadius: '15px', border: 'none', backgroundColor: misColores.con, color: getTextoParaFondo(misColores.con), fontWeight: '900', fontSize: '10px' }}>CON NIÑ@S</button>
              <button onClick={() => { setExcepciones({...excepciones, [diaSeleccionado]: { nota: textoExcepcion, estado: 'sin' }}); setDiaSeleccionado(null); }} style={{ flex: 1, padding: '18px', borderRadius: '15px', border: '1px solid #DDD', backgroundColor: misColores.sin, color: getTextoParaFondo(misColores.sin), fontWeight: '900', fontSize: '10px' }}>SIN NIÑ@S</button>
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