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
    setSeccionAbierta(seccionAbierta === sec ? null : sec);
  };

  const estiloBtnDirecto = (activo, tipo) => {
    const bg = tipo === 'con' ? misColores.con : misColores.sin;
    const txt = getTextoParaFondo(bg);
    let border = '1px solid #DDD';
    if (activo) border = '3px solid #2D408F'; 
    return {
      flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: bg, color: txt, border: border,
      fontWeight: activo ? '900' : '700', fontSize: '9px', cursor: 'pointer', transition: 'all 0.15s ease-out'
    };
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#FFF', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      <header style={{ padding: '8px 10px', borderBottom: '1px solid #EEE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/image2.png" alt="Logo" style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '5px' }} />
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#76B852', margin: 0 }}>CustodiApp</h1>
              <p style={{ margin: 0, fontSize: '9px', color: '#5F6368', fontWeight: '800' }}>GESTIÓN FAMILIAR</p>
            </div>
          </div>
          <button onClick={capturar} style={{ fontSize: '18px', background: '#F8F9FA', border: '1px solid #DDD', borderRadius: '50%', width: '36px', height: '36px' }}>📸</button>
        </div>
        <nav style={{ display: 'flex', gap: '2px' }}>
          {['Calendario', 'Año', 'Vacac.', 'Excep.', 'Ajustes'].map(v => (
            <button key={v} onClick={() => setVista(v)} style={{ flex: v === 'Calendario' ? 2 : 1, height: '32px', fontSize: v === 'Ajustes' ? '24px' : '9px', fontWeight: '900', borderRadius: '6px', border: 'none', backgroundColor: vista === v ? '#2D408F' : '#F8F9FA', color: vista === v ? '#FFF' : '#2D408F' }}>
              {v === 'Ajustes' ? '⚙️' : v.toUpperCase()}
            </button>
          ))}
        </nav>
      </header>

      <main ref={calendarRef} style={{ flex: 1, padding: '5px 10px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        
        {vista === 'Calendario' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <button onClick={() => setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth() - 1, 1))} style={{ fontSize: '24px', border: 'none', background: 'none', color: '#2D408F' }}>◀</button>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '18px', margin: 0, fontWeight: '900', color: '#2D408F' }}>{new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(fechaVisualizacion).toUpperCase()}</h2>
                <button onClick={() => setFechaVisualizacion(new Date())} style={{ border: 'none', background: 'none', color: '#76B852', fontSize: '11px', fontWeight: '900', textDecoration: 'underline' }}>HOY</button>
              </div>
              <button onClick={() => setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth() + 1, 1))} style={{ fontSize: '24px', border: 'none', background: 'none', color: '#2D408F' }}>▶</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', flex: 1, alignContent: 'center' }}>
              {diasSemana.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '900', color: '#AAA' }}>{d}</div>)}
              {getCeldas(fechaVisualizacion.getFullYear(), fechaVisualizacion.getMonth()).map((c, i) => {
                const custodial = getEstadoDia(c.f);
                const bg = c.m === 0 ? (custodial ? misColores.con : misColores.sin) : 'transparent';
                return (
                  <div key={i} onClick={() => abrirEditor(c.f.toDateString())}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1/1', fontSize: '18px', fontWeight: '900', borderRadius: '12px', backgroundColor: bg, color: getTextoParaFondo(bg), border: c.f.toDateString() === hoy.toDateString() ? '3px solid #2D408F' : '1px solid #EEE', opacity: c.m === 0 ? 1 : 0.3 }}>
                    {c.d}
                    {excepciones[c.f.toDateString()] && <div style={{ width: '6px', height: '6px', backgroundColor: '#F5A623', borderRadius: '50%', position: 'absolute', top: '3px', right: '3px', border: '1px solid white' }}></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '10px 0' }}>
              <div style={{ flex: 1, padding: '12px', backgroundColor: misColores.con, color: getTextoParaFondo(misColores.con), borderRadius: '10px', textAlign: 'center', fontWeight: '900', fontSize: '11px' }}>CON NIÑ@S</div>
              <div style={{ flex: 1, padding: '12px', backgroundColor: misColores.sin, color: getTextoParaFondo(misColores.sin), borderRadius: '10px', textAlign: 'center', fontWeight: '900', border: '1.5px solid #EEE', fontSize: '11px' }}>SIN NIÑ@S</div>
            </div>
          </>
        )}

        {vista === 'Año' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} onClick={() => { setFechaVisualizacion(new Date(fechaVisualizacion.getFullYear(), i, 1)); setVista('Calendario'); }} style={{ border: '1px solid #EEE', borderRadius: '8px', padding: '4px', cursor: 'pointer' }}>
                <h3 style={{ fontSize: '8px', textAlign: 'center', margin: '0 0 2px 0', color: '#2D408F' }}>{new Intl.DateTimeFormat('es', { month: 'short' }).format(new Date(fechaVisualizacion.getFullYear(), i, 1)).toUpperCase()}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' }}>
                  {getCeldas(fechaVisualizacion.getFullYear(), i).map((c, j) => {
                    const bg = c.m === 0 ? (getEstadoDia(c.f) ? misColores.con : misColores.sin) : 'transparent';
                    return <div key={j} style={{ width: '100%', aspectRatio: '1/1', backgroundColor: bg, borderRadius: '2px' }}></div>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {vista === 'Ajustes' && (
          <div style={{ padding: '5px' }}>
            <h3 style={{ fontSize: '14px', color: '#2D408F', marginBottom: '5px' }}>CONFIGURACIÓN CICLO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', background: '#F8F9FA', padding: '8px', borderRadius: '12px', marginBottom: '10px' }}>
              {cicloPersonalizado.map((esCon, i) => {
                const bg = esCon ? misColores.con : misColores.sin;
                return <div key={i} onClick={() => { const n = [...cicloPersonalizado]; n[i] = !n[i]; setCicloPersonalizado(n); }} style={{ height: '35px', borderRadius: '6px', backgroundColor: bg, color: getTextoParaFondo(bg), border: bg.toLowerCase()==='#ffffff'?'1px solid #DDD':'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                  <b>{i+1}</b><span style={{fontSize:'7px'}}>{esCon?'CON':'SIN'}</span>
                </div>
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
    </div>
  );
};

export default App;