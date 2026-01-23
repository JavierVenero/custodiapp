
import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import appLogo from "./assets/custodiapp_logo.png";

const TABS = [
  "Calendario",
  "Excepciones",
  "Vacaciones",
  "Importar",
  "Exportar",
  "Ajustes",
];

// ======================
// FUNCIÓN PRINCIPAL
// ======================
function App() {
const [activeTab, setActiveTab] = useState("Calendario");  // Semana base: lunes 19/01/2026, semana SIN por defecto
  const [baseDate, setBaseDate] = useState(() => {
    return localStorage.getItem("custodiapp.baseDate") || "2026-01-19";
  });

  const [withKids, setWithKids] = useState(() => {
    const saved = localStorage.getItem("custodiapp.withKids");
    return saved === null ? false : saved === "true"; // se guarda como string
  });

  // Colores configurables
  const [colorWithKids, setColorWithKids] = useState(() => {
    const stored = localStorage.getItem("custodiapp.colorWithKids");
    return !stored || stored === "null" ? "#d3e8ff" : stored;
  });

  const [colorNoKids, setColorNoKids] = useState(() => {
    const stored = localStorage.getItem("custodiapp.colorNoKids");
    return !stored || stored === "null" ? "#f1e8d5" : stored;
  });

  // Excepciones
  const [exceptions, setExceptions] = useState(() => {
    const saved = localStorage.getItem("custodiapp.exceptions");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // Vacaciones
  const [vacations, setVacations] = useState(() => {
    const saved = localStorage.getItem("custodiapp.vacations");
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // Guardar todo en localStorage
  useEffect(() => {
    localStorage.setItem("custodiapp.baseDate", baseDate);
    localStorage.setItem("custodiapp.withKids", String(withKids));
    localStorage.setItem("custodiapp.colorWithKids", colorWithKids);
    localStorage.setItem("custodiapp.colorNoKids", colorNoKids);
    localStorage.setItem("custodiapp.exceptions", JSON.stringify(exceptions));
    localStorage.setItem("custodiapp.vacations", JSON.stringify(vacations));
  }, [baseDate, withKids, colorWithKids, colorNoKids, exceptions, vacations]);

  // Exportar imagen
  const calendarRef = useRef(null);

  async function exportImage() {
    if (!calendarRef.current) return;

    try {
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });

      const now = new Date();
      const nombreMes = now.toLocaleString("es-ES", { month: "long" });
      const nombreArchivo = `CustodiApp_${nombreMes}_${now.getFullYear()}.png`;

      const link = document.createElement("a");
      link.download = nombreArchivo;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Error exportando imagen:", e);
      alert("Error exportando la imagen 😔");
    }
  }

  return (
    <div style={styles.page}>
      {/* Cabecera */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={appLogo} alt="CustodiApp" style={styles.logo} />
          <div>
            <h1 style={styles.title}>CustodiApp</h1>
            <p style={styles.subtitle}>
              Calendario de custodia claro y acordado.
            </p>
          </div>
        </div>
        <span style={styles.badge}>MVP · Versión 0.1</span>
      </header>

            {/* Pestañas */}
      <nav>
        {/* Fila 1: pestañas principales */}
        <div style={styles.tabsRow}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "Calendario" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("Calendario")}
          >
            Calendario
          </button>

          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "Excepciones" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("Excepciones")}
          >
            Excepciones
          </button>

          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "Vacaciones" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("Vacaciones")}
          >
            Vacaciones
          </button>
        </div>

        {/* Fila 2: pestañas secundarias, un poco más pequeñas */}
        <div style={styles.tabsRowSecondary}>
          <button
            style={{
              ...styles.secondaryTabButton,
              ...(activeTab === "Importar" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("Importar")}
          >
            Importar
          </button>

          <button
            style={{
              ...styles.secondaryTabButton,
              ...(activeTab === "Exportar" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("Exportar")}
          >
            Exportar
          </button>

          <button
            style={{
              ...styles.secondaryTabButton,
              ...(activeTab === "Ajustes" ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab("Ajustes")}
          >
            Ajustes
          </button>
        </div>
      </nav>

            {/* Contenido central */}
      <main style={styles.card}>
                {/* Calendario: siempre montado, pero escondido fuera de pantalla cuando no es la pestaña activa */}
        <div
          style={
            activeTab === "Calendario"
              ? { width: "100%" }
              : {
                  width: "100%",
                  position: "absolute",
                  left: "-99999px",
                  top: 0,
                  opacity: 0,
                  pointerEvents: "none",
                }
          }
        >
          <CalendarioPlaceholder
            baseDate={baseDate}
            withKids={withKids}
            colorWithKids={colorWithKids}
            colorNoKids={colorNoKids}
            exceptions={exceptions}
            vacations={vacations}
            calendarRef={calendarRef}
          />
        </div>

        {/* Excepciones */}
        <div
          style={{
            display: activeTab === "Excepciones" ? "block" : "none",
          }}
        >
          <ExcepcionesPlaceholder
            exceptions={exceptions}
            setExceptions={setExceptions}
          />
        </div>

        {/* Vacaciones */}
        <div
          style={{
            display: activeTab === "Vacaciones" ? "block" : "none",
          }}
        >
          <VacacionesPlaceholder
            vacations={vacations}
            setVacations={setVacations}
          />
        </div>

        {/* Importar */}
        <div
          style={{
            display: activeTab === "Importar" ? "block" : "none",
          }}
        >
          <ImportarPlaceholder />
        </div>

        {/* Exportar */}
        <div
          style={{
            display: activeTab === "Exportar" ? "block" : "none",
          }}
        >
          <ExportarPlaceholder onExport={exportImage} />
        </div>

        {/* Ajustes */}
        <div
          style={{
            display: activeTab === "Ajustes" ? "block" : "none",
          }}
        >
          <AjustesPlaceholder
            baseDate={baseDate}
            setBaseDate={setBaseDate}
            withKids={withKids}
            setWithKids={setWithKids}
            colorWithKids={colorWithKids}
            setColorWithKids={setColorWithKids}
            colorNoKids={colorNoKids}
            setColorNoKids={setColorNoKids}
          />
        </div>
      </main>

      <footer style={styles.footer}>CustodiApp · Proyecto en desarrollo</footer>
    </div>
  );
}

// ======================
// CALENDARIO REAL
// ======================
function CalendarioPlaceholder({
  baseDate,
  withKids,
  colorWithKids,
  colorNoKids,
  exceptions = [],
  vacations = [],
  calendarRef,
}) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Fecha base (lunes de semana base)
  const [baseYear, baseMonth, baseDay] = baseDate
    .split("-")
    .map((n) => parseInt(n, 10));
  const baseUTC = Date.UTC(baseYear, baseMonth - 1, baseDay);

  // Hoy
  const today = new Date();
  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diffToday = Math.floor((todayUTC - baseUTC) / MS_PER_DAY);
  const weeksPassedToday = Math.floor(diffToday / 7);
  const isThisWeekWithKids =
    weeksPassedToday % 2 === 0 ? withKids : !withKids;

  // Mes visible
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth()); // 0–11

  // "Ir a fecha"
  const [lookupDate, setLookupDate] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");

  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  // Helper: patrón semana sí / semana no
  function isWithKidsByBasePattern(dateObj) {
    const utc = Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    );
    const diff = Math.floor((utc - baseUTC) / MS_PER_DAY);
    const weeksPassed = Math.floor(diff / 7);
    return weeksPassed % 2 === 0 ? withKids : !withKids;
  }

  // === EXCEPCIONES (start / end en YYYY-MM-DD) ===
  function getExceptionForDate(dateObj) {
    if (!exceptions || exceptions.length === 0) return null;

    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const ex = exceptions.find((e) => {
      if (!e.start || !e.end) return false;
      return e.start <= dateStr && dateStr <= e.end;
    });

    if (!ex) return null;

    const withKidsFlag = ex.owner === "conmigo";
    return { ...ex, withKids: withKidsFlag };
  }

  // === VACACIONES (from / to en YYYY-MM-DD) ===
  function getVacationForDate(dateObj) {
    if (!vacations || vacations.length === 0) return null;

    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    return vacations.find((v) => v.from <= dateStr && dateStr <= v.to) || null;
  }

  function handlePrevMonth() {
    setVisibleMonth((prev) => {
      if (prev === 0) {
        setVisibleYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function handleNextMonth() {
    setVisibleMonth((prev) => {
      if (prev === 11) {
        setVisibleYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }

  function handleLookup() {
    if (!lookupDate) {
      setLookupMessage("");
      return;
    }

    const d = new Date(lookupDate);
    if (Number.isNaN(d.getTime())) {
      setLookupMessage("Fecha no válida.");
      return;
    }

    setVisibleYear(d.getFullYear());
    setVisibleMonth(d.getMonth());

    let isWithKidsDay = isWithKidsByBasePattern(d);

    const vac = getVacationForDate(d);
    if (vac) {
      isWithKidsDay = vac.withKids;
    }

    const ex = getExceptionForDate(d);
    if (ex) {
      isWithKidsDay = ex.withKids;
    }

    setLookupMessage(
      isWithKidsDay
        ? "Ese día te toca CON 🎈"
        : "Ese día te toca SIN 🧘‍♂️"
    );
  }

  // === Construir las 42 celdas del calendario ===
  const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
  const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();

  // Mes anterior
  const prevMonthDate = new Date(visibleYear, visibleMonth, 0);
  const daysInPrevMonth = prevMonthDate.getDate();
  const prevMonth = prevMonthDate.getMonth();
  const prevYear = prevMonthDate.getFullYear();

  const cells = [];

  // Días del mes anterior
  for (let i = 0; i < firstWeekday; i++) {
    const day = daysInPrevMonth - firstWeekday + 1 + i;
    cells.push(new Date(prevYear, prevMonth, day));
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(visibleYear, visibleMonth, day));
  }

  // Días del mes siguiente hasta 42 celdas
  const totalCells = 42;
  if (cells.length < totalCells) {
    const nextMonthDate = new Date(visibleYear, visibleMonth + 1, 1);
    const nextMonth = nextMonthDate.getMonth();
    const nextYear = nextMonthDate.getFullYear();
    let day = 1;

    while (cells.length < totalCells) {
      cells.push(new Date(nextYear, nextMonth, day));
      day++;
    }
  }

  // Semana actual (para resaltar la fila)
  const todayStartUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const weekdayToday = (today.getDay() + 6) % 7; // 0 = lunes
  const startOfWeekUTC = todayStartUTC - weekdayToday * MS_PER_DAY;
  const endOfWeekUTC = startOfWeekUTC + 6 * MS_PER_DAY;

  const thisWeekLabel = isThisWeekWithKids
    ? "Esta semana: CON 🎈"
    : "Esta semana: SIN 🧘‍♂️";

  return (
    <div ref={calendarRef}>
      <h2 style={styles.blockTitle}>Calendario de custodia</h2>
      <p style={styles.blockText}>
        Navega mes a mes y consulta rápidamente si en una fecha concreta te toca
        con niñ@s o sin niñ@s. Las vacaciones y excepciones pisan el patrón
        base de semanas alternas.
      </p>

      <p style={styles.blockTextStrong}>{thisWeekLabel}</p>

      {/* Ir a una fecha concreta */}
      <div style={styles.lookupRow}>
        <div>
          <label style={styles.label}>
            ¿Quieres saber si en una fecha estás CON o SIN?
            <input
              type="date"
              value={lookupDate}
              onChange={(e) => setLookupDate(e.target.value)}
              style={styles.input}
            />
          </label>
          <button style={styles.secondaryButton} onClick={handleLookup}>
            Ir a esta fecha
          </button>
        </div>
        {lookupMessage && (
          <p style={styles.lookupMessage}>{lookupMessage}</p>
        )}
      </div>

      {/* Controles de mes */}
      <div style={styles.monthHeader}>
        <button style={styles.navButton} onClick={handlePrevMonth}>
          ‹
        </button>
        <span style={styles.monthTitle}>
          {monthNames[visibleMonth]} {visibleYear}
        </span>
        <button style={styles.navButton} onClick={handleNextMonth}>
          ›
        </button>
      </div>

      {/* Cabecera días de la semana */}
      <div style={styles.weekdaysRow}>
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} style={styles.weekdayCell}>
            {d}
          </div>
        ))}
      </div>

      {/* Rejilla de días */}
      <div style={styles.daysGrid}>
        {cells.map((dateObj, idx) => {
          const dayNumber = dateObj.getDate();
          const isOtherMonth = dateObj.getMonth() !== visibleMonth;

          // 1) Patrón base
          let isWithKidsDay = isWithKidsByBasePattern(dateObj);

          // 2) Vacaciones pisan el patrón base
          const vac = getVacationForDate(dateObj);
          if (vac) {
            isWithKidsDay = vac.withKids;
          }

          // 3) Excepciones pisan todo lo anterior
          const ex = getExceptionForDate(dateObj);
          if (ex) {
            isWithKidsDay = ex.withKids;
          }

          const cellUTC = Date.UTC(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate()
          );

          const isToday =
            dateObj.getFullYear() === today.getFullYear() &&
            dateObj.getMonth() === today.getMonth() &&
            dateObj.getDate() === today.getDate();

          const isInCurrentWeek =
            cellUTC >= startOfWeekUTC && cellUTC <= endOfWeekUTC;

          const bgColor = isWithKidsDay ? colorWithKids : colorNoKids;

          return (
            <div
              key={`day-${idx}`}
              style={{
                ...styles.dayCell,
                backgroundColor: bgColor,
                boxShadow: isInCurrentWeek
                  ? "0 0 0 2px rgba(56, 189, 248, 0.85)"
                  : "none",
                fontWeight: isToday ? 700 : 500,
                border: isToday
                  ? "2px solid #111827"
                  : "1px solid rgba(148,163,184,0.4)",
                opacity: isOtherMonth ? 0.45 : 1,
              }}
            >
              {dayNumber}
            </div>
          );
        })}
      </div>

            {/* Leyenda */}
<div style={styles.legendRow}>
  <div style={styles.legendItem}>
    <span
      style={{
        ...styles.legendDot,
        backgroundColor: colorWithKids,
      }}
    />
    <span>Con niñ@s</span>
  </div>

  <div style={styles.legendItem}>
    <span
      style={{
        ...styles.legendDot,
        backgroundColor: colorNoKids,
      }}
    />
    <span>Sin niñ@s</span>
  </div>
</div>
    </div>
  );
}

// ======================
// EXCEPCIONES
// ======================
function ExcepcionesPlaceholder({ exceptions, setExceptions }) {
  const [type, setType] = useState("vacaciones");
  const [owner, setOwner] = useState("conmigo");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");

  function formatDate(dStr) {
    if (!dStr) return "";
    const [y, m, d] = dStr.split("-");
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }

  function handleAddException(e) {
    e.preventDefault();

    if (!start || !end) {
      alert("Falta fecha de inicio o fin.");
      return;
    }

    let startDate = start;
    let endDate = end;

    if (startDate > endDate) {
      const tmp = startDate;
      startDate = endDate;
      endDate = tmp;
    }

    const newException = {
      id: Date.now(),
      type,
      owner,
      start: startDate,
      end: endDate,
      note: note.trim(),
    };

    setExceptions([...exceptions, newException]);

    setStart("");
    setEnd("");
    setNote("");
  }

  function handleDeleteException(id) {
    const filtered = exceptions.filter((ex) => ex.id !== id);
    setExceptions(filtered);
  }

  return (
    <div>
      <h2 style={styles.blockTitle}>Excepciones</h2>
      <p style={styles.blockText}>
        Aquí apuntas los cambios puntuales sobre el calendario base: vacaciones
        extra, intercambios de fin de semana, viajes largos, etc.
      </p>

      <form
        onSubmit={handleAddException}
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#eef2ff",
        }}
      >
        <label style={styles.blockText}>
          Tipo de excepción:
          <select
  value={type}
  onChange={(e) => setType(e.target.value)}
  style={styles.select}
>
            <option value="vacaciones">Vacaciones</option>
            <option value="intercambio">
              Intercambio de semana/fin de semana
            </option>
            <option value="viaje">Viaje especial</option>
            <option value="otro">Otro</option>
          </select>
        </label>

        <label style={styles.blockText}>
          ¿Con quién estarán los niños en este periodo?
          <select
  value={owner}
  onChange={(e) => setOwner(e.target.value)}
  style={styles.select}
>
            <option value="conmigo">Conmigo</option>
            <option value="con_la_otra_parte">Con la otra parte</option>
          </select>
        </label>

        <label style={styles.blockText}>
  Desde:
  <input
    type="date"
    value={start}
    onChange={(e) => setStart(e.target.value)}
    style={styles.input}
  />
</label>

        <label style={styles.blockText}>
  Hasta:
  <input
    type="date"
    value={end}
    onChange={(e) => setEnd(e.target.value)}
    style={styles.input}
  />
</label>

        <label style={styles.blockText}>
  Nota (opcional):
  <textarea
    value={note}
    onChange={(e) => setNote(e.target.value)}
    placeholder="Ej: Viaje península, campamento, cambio de semana…"
    style={{
      ...styles.input,
      minHeight: 60,
      fontFamily:
        "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    }}
  />
</label>

        <button
          type="submit"
          style={{
            marginTop: 4,
            alignSelf: "flex-start",
            padding: "6px 12px",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#4f46e5",
            color: "white",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Añadir excepción
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, margin: 0, marginBottom: 8 }}>
          Historial de excepciones (solo en este dispositivo)
        </h3>

        {exceptions.length === 0 && (
          <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
            Aún no has añadido ninguna excepción.
          </p>
        )}

        {exceptions.map((ex) => (
          <div
            key={ex.id}
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              fontSize: 12,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {formatDate(ex.start)} → {formatDate(ex.end)} ·{" "}
              {ex.owner === "conmigo" ? "Contigo" : "Con la otra parte"}
            </div>
            <div style={{ color: "#6b7280" }}>
              Tipo: {ex.type}
              {ex.note && ` · ${ex.note}`}
            </div>
            <button
              type="button"
              onClick={() => handleDeleteException(ex.id)}
              style={{
                alignSelf: "flex-start",
                marginTop: 2,
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid #fecaca",
                backgroundColor: "#fef2f2",
                color: "#b91c1c",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ======================
// VACACIONES
// ======================
function VacacionesPlaceholder({ vacations, setVacations }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [withKids, setWithKids] = useState(true);

  function handleAddVacation() {
    if (!from || !to) {
      alert("Pon al menos fecha de inicio y fin de las vacaciones 😊");
      return;
    }

    let fromDate = from;
    let toDate = to;

    if (fromDate > toDate) {
      const tmp = fromDate;
      fromDate = toDate;
      toDate = tmp;
    }

    const newVacation = {
      id: Date.now(),
      name: name || "Vacaciones",
      from: fromDate,
      to: toDate,
      withKids,
    };

    setVacations([...vacations, newVacation]);
    setName("");
    setFrom("");
    setTo("");
    setWithKids(true);
  }

  function handleDeleteVacation(id) {
    setVacations(vacations.filter((v) => v.id !== id));
  }

  return (
    <div>
      <h2 style={styles.blockTitle}>Vacaciones y periodos especiales</h2>
      <p style={styles.blockText}>
        Aquí puedes guardar bloques largos que pisan el patrón normal de
        semanas alternas: verano, Navidad, Semana Santa, puentes largos...
      </p>

      <div style={styles.block}>
        <h3 style={styles.blockSubtitle}>Añadir vacaciones</h3>

        <div style={styles.formRow}>
          <label style={styles.label}>
            Nombre del periodo
            <input
              type="text"
              placeholder="Verano 2026, Navidad, Semana Santa..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Hasta
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>
            ¿Con quién estarán los niños en este periodo?
            <select
              value={withKids ? "with" : "without"}
              onChange={(e) => setWithKids(e.target.value === "with")}
              style={styles.select}
            >
              <option value="with">Conmigo</option>
              <option value="without">Con la otra parte</option>
            </select>
          </label>
        </div>

        <button style={styles.primaryButton} onClick={handleAddVacation}>
          Guardar vacaciones
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={styles.blockSubtitle}>Vacaciones guardadas</h3>

        {(!vacations || vacations.length === 0) && (
          <p style={styles.blockText}>
            Aún no has añadido ningún periodo especial. Empieza con verano,
            Navidad o Semana Santa.
          </p>
        )}

        {vacations && vacations.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {vacations.map((v) => (
              <li
                key={v.id}
                style={{
                  padding: 10,
                  marginBottom: 8,
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {v.name}{" "}
                    <span style={{ opacity: 0.7 }}>
                      ({v.withKids ? "Conmigo" : "Con la otra parte"})
                    </span>
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    {v.from} → {v.to}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteVacation(v.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ======================
// IMPORTAR / EXPORTAR / AJUSTES
// ======================
function ImportarPlaceholder() {
  return (
    <div>
      <h2 style={styles.blockTitle}>Importar acuerdo de custodia</h2>
      <p style={styles.blockText}>
        Aquí podrás subir el PDF de tu sentencia o acuerdo de custodia para que
        la app lea automáticamente las reglas. Esta versión todavía es un
        prototipo local.
      </p>
    </div>
  );
}

function ExportarPlaceholder({ onExport }) {
  return (
    <div>
      <h2 style={styles.blockTitle}>Exportar</h2>
      <p style={styles.blockText}>
        Exporta el mes visible como imagen para compartirla por WhatsApp, email
        o donde quieras.
      </p>
      <button style={styles.primaryButton} onClick={onExport}>
        Descargar imagen de este mes
      </button>
    </div>
  );
}

function AjustesPlaceholder({
  baseDate,
  setBaseDate,
  withKids,
  setWithKids,
  colorWithKids,
  setColorWithKids,
  colorNoKids,
  setColorNoKids,
}) {
function formatDMY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr; // por si acaso viene raro
  return d.toLocaleDateString("es-ES"); // formato español: 19/01/2026
}
  return (
    <div>
      <h2 style={styles.blockTitle}>Ajustes</h2>
      <p style={styles.blockText}>
        Define una fecha de referencia y si esa semana es con niñ@s o sin niñ@s.
        A partir de ahí el calendario calcula el patrón de semanas alternas.
      </p>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Fecha de establecimiento */}
        <label style={styles.label}>
  Fecha de establecimiento de custodia:
  <input
    type="date"
    value={baseDate}
    onChange={(e) => setBaseDate(e.target.value)}
    style={{
      ...styles.input,
      maxWidth: 130,     // ancho más pequeñito
      display: "inline-block",
    }}
  />
</label>

        {/* Tipo de semana */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={styles.blockText}>
            Marca qué tipo de semana es esta fecha de referencia:
          </span>

          <label style={styles.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="weekType"
                checked={withKids === true}
                onChange={() => setWithKids(true)}
              />
              <span>Esta semana es CON niñ@s</span>
            </div>
          </label>

          <label style={styles.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="radio"
                name="weekType"
                checked={withKids === false}
                onChange={() => setWithKids(false)}
              />
              <span>Esta semana es SIN niñ@s</span>
            </div>
          </label>
        </div>

        {/* Colores */}
        <label style={styles.blockText}>
          Color semana con niñ@s:
          <input
            type="color"
            value={colorWithKids}
            onChange={(e) => setColorWithKids(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label style={styles.blockText}>
          Color semana sin niñ@s:
          <input
            type="color"
            value={colorNoKids}
            onChange={(e) => setColorNoKids(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </label>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "#475569" }}>
  Semana base: {formatDMY(baseDate)} — {withKids ? "Con niñ@s" : "Sin niñ@s"}
</p>
    </div>
  );
}
// ======================
// ESTILOS
// ======================
const styles = {
  page: {
    minHeight: "100vh",
    padding: 8,                          // antes 16
    backgroundColor: "#f7f3eb",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box",
    color: "#1e293b",
  },

  header: {
    width: "100%",
    maxWidth: 900,                       // un pelín menos
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,                     // antes 12
    color: "#1e293b",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,                              // antes 12
    color: "#1e293b",
  },

  logo: {
    width: 110,                          // antes 150
    height: 110,                         // antes 150
    borderRadius: 4,
    objectFit: "contain",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: 20,                        // antes 24
    color: "#1e293b",
  },

  subtitle: {
    margin: 0,
    fontSize: 11,                        // un pelín más pequeño
    color: "#475569",
  },

  badge: {
    fontSize: 10,
    padding: "3px 7px",
    borderRadius: 999,
    backgroundColor: "#bbf7d0",
    color: "#065f46",
  },

      tabRow: {
    display: "flex",
    flexWrap: "wrap",           // por si el móvil es muy estrecho
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
    paddingInline: 6,           // deja aire a izquierda y derecha
  },

     tabsRowSecondary: {
  marginTop: 8,
  display: "flex",
  justifyContent: "center",
  gap: 8,
  flexWrap: "wrap",
},

secondaryTabButton: {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
},

  tabButtonActive: {
    backgroundColor: "#0ea5e9",
    color: "white",
    borderColor: "#0ea5e9",
    boxShadow: "0 2px 6px rgba(14, 165, 233, 0.35)",
  },

  card: {
    width: "100%",
    maxWidth: 900,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,                         // antes 16
    boxShadow: "0 8px 20px rgba(15,23,42,0.08)",
    boxSizing: "border-box",
    minHeight: 220,                      // antes 260
    color: "#1e293b",
  },

  footer: {
    width: "100%",
    maxWidth: 900,
    marginTop: 8,
    fontSize: 10,
    textAlign: "center",
    color: "#475569",
  },

  blockTitle: {
    fontSize: 16,
    margin: 0,
    marginBottom: 4,
    color: "#1e293b",
  },

  blockText: {
    margin: 0,
    fontSize: 12,
    color: "#1e293b",
  },

  blockTextStrong: {
    margin: "6px 0 0 0",
    fontSize: 12,
    fontWeight: 600,
    color: "#1e293b",
  },

  block: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    color: "#1e293b",
  },

  blockSubtitle: {
    fontSize: 14,
    margin: 0,
    marginBottom: 6,
    color: "#1e293b",
  },

  weekdaysRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 3,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 11,
    textAlign: "center",
    color: "#1e293b",
  },

  weekdayCell: {
    padding: 2,
    color: "#1e293b",
    fontWeight: 600,
  },

  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 3,
  },

  dayCell: {
    borderRadius: 7,
    border: "1px solid rgba(148, 163, 184, 0.4)",
    minHeight: 32,                       // antes 40
    padding: 4,                          // antes 6
    fontSize: 11,                        // antes 12
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    color: "#1e293b",
  },

  legendRow: {
    display: "flex",
    gap: 10,
    marginTop: 6,
    fontSize: 11,
    alignItems: "center",
    color: "#1e293b",
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    color: "#1e293b",
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },

  lookupRow: {
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    color: "#1e293b",
  },

  label: {
    fontSize: 12,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    color: "#1e293b",
  },

  input: {
    marginTop: 3,
    padding: 5,
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#1e293b",
  },

  formRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
    color: "#1e293b",
  },

  select: {
    marginTop: 3,
    padding: 5,
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#1e293b",
  },

  primaryButton: {
    marginTop: 6,
    padding: "5px 11px",
    borderRadius: 999,
    border: "none",
    backgroundColor: "#0ea5e9",
    color: "white",
    fontSize: 12,
    cursor: "pointer",
  },

  secondaryButton: {
    marginTop: 6,
    padding: "5px 9px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    fontSize: 11,
    cursor: "pointer",
    color: "#1e293b",
  },

  monthHeader: {
    marginTop: 8,
    marginBottom: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#1e293b",
  },

  navButton: {
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    padding: "1px 7px",
    cursor: "pointer",
    fontSize: 13,
    color: "#1e293b",
  },

  monthTitle: {
    fontSize: 14,
    fontWeight: 600,
    textTransform: "capitalize",
    color: "#1e293b",
  },

  lookupMessage: {
    margin: 0,
    fontSize: 11,
    color: "#1e293b",
  },
};

export default App;