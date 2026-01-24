import React, { useState, useEffect } from "react";
import appLogo from "./assets/custodiapp_logo.png";

// ======================
// CONSTANTES Y CONFIGURACIÓN
// ======================
const TABS = ["Calendario", "Excepciones", "Vacaciones", "Importar", "Ajustes"];

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const WEEK_DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ======================
// UTILIDADES
// ======================
const formatDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplayDate = (dStr) => {
  if (!dStr) return "";
  const [y, m, d] = dStr.split("-");
  return `${d}/${m}/${y}`;
};

const getShiftStatus = (dateObj, baseDateStr, baseWithKids, exceptions, vacations) => {
  const dateStr = formatDateStr(dateObj);

  // 1) Excepciones
  const ex = exceptions.find(
    e => e.start && e.end && e.start <= dateStr && dateStr <= e.end
  );
  if (ex) return e.owner === "conmigo";

  // 2) Vacaciones
  const vac = vacations.find(v => v.from <= dateStr && dateStr <= v.to);
  if (vac) return vac.withKids;

  // 3) Patrón base alterno
  const [bY, bM, bD] = baseDateStr.split("-").map(n => parseInt(n, 10));
  const baseUTC = Date.UTC(bY, bM - 1, bD);
  const targetUTC = Date.UTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate()
  );
  const diffDays = Math.floor((targetUTC - baseUTC) / MS_PER_DAY);
  const weeksPassed = Math.floor(diffDays / 7);
  return weeksPassed % 2 === 0 ? baseWithKids : !baseWithKids;
};

// ======================
// COMPONENTE PRINCIPAL
// ======================
export default function App() {
  const [activeTab, setActiveTab] = useState("Calendario");

  const [baseDate, setBaseDate] = useState(
    () => localStorage.getItem("custodiapp.baseDate") || "2026-01-19"
  );
  const [withKids, setWithKids] = useState(
    () => localStorage.getItem("custodiapp.withKids") === "true"
  );
  const [colorWithKids, setColorWithKids] = useState(
    () => localStorage.getItem("custodiapp.colorWithKids") || "#d3e8ff"
  );
  const [colorNoKids, setColorNoKids] = useState(
    () => localStorage.getItem("custodiapp.colorNoKids") || "#f1e8d5"
  );
  const [exceptions, setExceptions] = useState(
    () => JSON.parse(localStorage.getItem("custodiapp.exceptions") || "[]")
  );
  const [vacations, setVacations] = useState(
    () => JSON.parse(localStorage.getItem("custodiapp.vacations") || "[]")
  );

  useEffect(() => {
    localStorage.setItem("custodiapp.baseDate", baseDate);
    localStorage.setItem("custodiapp.withKids", String(withKids));
    localStorage.setItem("custodiapp.colorWithKids", colorWithKids);
    localStorage.setItem("custodiapp.colorNoKids", colorNoKids);
    localStorage.setItem("custodiapp.exceptions", JSON.stringify(exceptions));
    localStorage.setItem("custodiapp.vacations", JSON.stringify(vacations));
  }, [baseDate, withKids, colorWithKids, colorNoKids, exceptions, vacations]);

  return (
    <div style={styles.page}>
      <Header />

      <nav style={styles.tabsRow}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={
              activeTab === tab
                ? { ...styles.tabButton, ...styles.tabButtonActive }
                : styles.tabButton
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      <main style={styles.card}>
        <div
          style={
            activeTab === "Calendario"
              ? styles.tabContentActive
              : styles.tabContentHidden
          }
        >
          <CalendarioView
            baseDate={baseDate}
            withKids={withKids}
            colorWithKids={colorWithKids}
            colorNoKids={colorNoKids}
            exceptions={exceptions}
            vacations={vacations}
          />
        </div>

        {activeTab === "Excepciones" && (
          <ExcepcionesView
            exceptions={exceptions}
            setExceptions={setExceptions}
          />
        )}
        {activeTab === "Vacaciones" && (
          <VacacionesView vacations={vacations} setVacations={setVacations} />
        )}
        {activeTab === "Importar" && (
          <ViewPlaceholder
            title="Importar acuerdo"
            desc="En futuras versiones podrás subir tu PDF de convenio para que CustodiApp lo lea automáticamente."
          />
        )}
        {activeTab === "Ajustes" && (
          <AjustesView
            baseDate={baseDate}
            setBaseDate={setBaseDate}
            withKids={withKids}
            setWithKids={setWithKids}
            colorWithKids={colorWithKids}
            setColorWithKids={setColorWithKids}
            colorNoKids={colorNoKids}
            setColorNoKids={setColorNoKids}
          />
        )}
      </main>

      <footer style={styles.footer}>
        CustodiApp · Proyecto en desarrollo
      </footer>
    </div>
  );
}

// ======================
// SUB-COMPONENTES
// ======================
const Header = () => (
  <header style={styles.header}>
    <div style={styles.headerLeft}>
      <img src={appLogo} alt="Logo" style={styles.logo} />
      <div>
        <h1 style={styles.title}>CustodiApp</h1>
        <p style={styles.subtitle}>Calendario de custodia claro y acordado.</p>
      </div>
    </div>
    <span style={styles.badge}>MVP · Versión 0.1</span>
  </header>
);

const ViewPlaceholder = ({ title, desc }) => (
  <div>
    <h2 style={styles.blockTitle}>{title}</h2>
    <p style={styles.blockText}>{desc}</p>
  </div>
);

function CalendarioView({
  baseDate,
  withKids,
  colorWithKids,
  colorNoKids,
  exceptions,
  vacations
}) {
  const [viewDate, setViewDate] = useState(new Date());
  const [lookupDate, setLookupDate] = useState("");
  const [lookupResult, setLookupResult] = useState("");

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const handleMonthNav = (offset) =>
    setViewDate(new Date(year, month + offset, 1));

  const handleLookup = () => {
    if (!lookupDate) return;
    const d = new Date(lookupDate);
    if (isNaN(d)) return;
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    const status = getShiftStatus(d, baseDate, withKids, exceptions, vacations);
    setLookupResult(
      status
        ? "Ese día te toca CON niñ@s"
        : "Ese día te toca SIN niñ@s"
    );
  };

  const generateGrid = () => {
    const cells = [];
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = firstDay; i > 0; i--) {
      cells.push(new Date(year, month - 1, prevMonthDays - i + 1));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(year, month, i));
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push(new Date(year, month + 1, i));
    }
    return cells;
  };

  return (
    <div style={{ backgroundColor: "#ffffff" }}>
      <h2 style={styles.blockTitle}>Calendario de custodia</h2>
<p style={styles.blockText}>
  Navega mes a mes y consulta rápidamente si en una semana concreta te toca con niñ@s o sin niñ@s.
</p>

      <div style={styles.lookupRow}>
        <input
          type="date"
          value={lookupDate}
          onChange={(e) => setLookupDate(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleLookup} style={styles.secondaryButton}>
          Ir a esta fecha
        </button>
        {lookupResult && (
          <p style={styles.lookupMessage}>{lookupResult}</p>
        )}
      </div>

      <div style={styles.monthHeader}>
        <button onClick={() => handleMonthNav(-1)} style={styles.navButton}>
          ‹
        </button>
        <span style={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={() => handleMonthNav(1)} style={styles.navButton}>
          ›
        </button>
      </div>

      <div style={styles.weekdaysRow}>
        {WEEK_DAYS.map((d) => (
          <div key={d} style={styles.weekdayCell}>
            {d}
          </div>
        ))}
      </div>

      <div style={styles.daysGrid}>
        {generateGrid().map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const status = getShiftStatus(
            d,
            baseDate,
            withKids,
            exceptions,
            vacations
          );
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              style={{
                ...styles.dayCell,
                backgroundColor: status ? colorWithKids : colorNoKids,
                opacity: isCurrentMonth ? 1 : 0.4,
                border: isToday
                  ? "2px solid #111827"
                  : "1px solid rgba(0,0,0,0.1)",
                color: "#1e293b",
                fontWeight: isToday ? "bold" : "normal"
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>

      <div style={styles.legendRow}>
        <div style={styles.legendItem}>
          <span
            style={{ ...styles.legendDot, backgroundColor: colorWithKids }}
          />{" "}
          Con niñ@s
        </div>
        <div style={styles.legendItem}>
          <span
            style={{ ...styles.legendDot, backgroundColor: colorNoKids }}
          />{" "}
          Sin niñ@s
        </div>
      </div>
    </div>
  );
}

function ExcepcionesView({ exceptions, setExceptions }) {
  const [form, setForm] = useState({
    start: "",
    end: "",
    owner: "conmigo",
    type: "intercambio"
  });

  const addEx = (e) => {
    e.preventDefault();
    if (!form.start || !form.end) return;
    setExceptions([...exceptions, { ...form, id: Date.now() }]);
    setForm({ ...form, start: "", end: "" });
  };

  return (
    <div>
      <h2 style={styles.blockTitle}>Excepciones</h2>
      <p style={styles.blockText}>
        Aquí apuntas cambios puntuales sobre el calendario base: vacaciones
        extra, intercambios de fin de semana, viajes largos, etc.
      </p>

      <form onSubmit={addEx} style={styles.formContainer}>
        <label style={styles.label}>
          Desde:
          <input
            type="date"
            value={form.start}
            onChange={(e) =>
              setForm({ ...form, start: e.target.value })
            }
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          Hasta:
          <input
            type="date"
            value={form.end}
            onChange={(e) =>
              setForm({ ...form, end: e.target.value })
            }
            style={styles.input}
          />
        </label>
        <label style={styles.label}>
          ¿Con quién?
          <select
            value={form.owner}
            onChange={(e) =>
              setForm({ ...form, owner: e.target.value })
            }
            style={styles.select}
          >
            <option value="conmigo">Conmigo</option>
            <option value="otra_parte">Con la otra parte</option>
          </select>
        </label>
        <button type="submit" style={styles.primaryButton}>
          Añadir excepción
        </button>
      </form>

      {exceptions.map((ex) => (
        <div key={ex.id} style={styles.listItem}>
          <span>
            {formatDisplayDate(ex.start)} - {formatDisplayDate(ex.end)} (
            {ex.owner})
          </span>
          <button
            onClick={() =>
              setExceptions(exceptions.filter((e) => e.id !== ex.id))
            }
            style={styles.deleteTextButton}
          >
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}

function VacacionesView({ vacations, setVacations }) {
  const [form, setForm] = useState({
    name: "",
    from: "",
    to: "",
    withKids: true
  });

  const addVac = () => {
    if (!form.from || !form.to) return;
    setVacations([...vacations, { ...form, id: Date.now() }]);
    setForm({ name: "", from: "", to: "", withKids: true });
  };

  return (
    <div>
      <h2 style={styles.blockTitle}>Vacaciones</h2>
      <p style={styles.blockText}>
        Define los bloques de vacaciones (Navidad, verano, Semana Santa…) y con
        quién estarán los niñ@s.
      </p>

      <div style={styles.formContainer}>
        <input
          type="text"
          placeholder="Nombre del periodo (ej. Verano 2026)"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          style={styles.input}
        />
        <input
          type="date"
          value={form.from}
          onChange={(e) =>
            setForm({ ...form, from: e.target.value })
          }
          style={styles.input}
        />
        <input
          type="date"
          value={form.to}
          onChange={(e) =>
            setForm({ ...form, to: e.target.value })
          }
          style={styles.input}
        />
        <button onClick={addVac} style={styles.primaryButton}>
          Guardar
        </button>
      </div>

      {vacations.map((v) => (
        <div key={v.id} style={styles.listItem}>
          <span>
            {v.name}: {formatDisplayDate(v.from)} -{" "}
            {formatDisplayDate(v.to)}
          </span>
          <button
            onClick={() =>
              setVacations(vacations.filter((x) => x.id !== v.id))
            }
            style={styles.deleteTextButton}
          >
            Borrar
          </button>
        </div>
      ))}
    </div>
  );
}

function AjustesView({
  baseDate,
  setBaseDate,
  withKids,
  setWithKids,
  colorWithKids,
  setColorWithKids,
  colorNoKids,
  setColorNoKids
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
      <h2 style={styles.blockTitle}>Ajustes</h2>

      <label style={styles.label}>
        Inicio del patrón:
        <input
          type="date"
          value={baseDate}
          onChange={(e) => setBaseDate(e.target.value)}
          style={styles.input}
        />
      </label>

      <label style={styles.label}>
        ¿Empieza CON niñ@s?
        <input
          type="checkbox"
          checked={withKids}
          onChange={(e) => setWithKids(e.target.checked)}
        />
      </label>

      <label style={styles.label}>
        Color CON:
        <input
          type="color"
          value={colorWithKids}
          onChange={(e) => setColorWithKids(e.target.value)}
        />
      </label>

      <label style={styles.label}>
        Color SIN:
        <input
          type="color"
          value={colorNoKids}
          onChange={(e) => setColorNoKids(e.target.value)}
        />
      </label>
    </div>
  );
}

// ======================
// ESTILOS
// ======================
const styles = {
  page: {
    minHeight: "100vh",
    padding: "16px",
    backgroundColor: "#f7f3eb",
    color: "#1e293b",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxSizing: "border-box"
  },
  header: {
    width: "100%",
    maxWidth: "900px",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "15px" },
  logo: { width: "80px", height: "80px", objectFit: "contain" },
  title: { fontSize: "24px", margin: 0, color: "#1e293b" },
  subtitle: { fontSize: "12px", color: "#475569", margin: 0 },
  badge: {
    fontSize: "10px",
    backgroundColor: "#bbf7d0",
    color: "#065f46",
    padding: "4px 8px",
    borderRadius: "10px",
    alignSelf: "center"
  },
    tabsRow: {
    // Usamos grid para que se repartan en filas, sin scroll lateral
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    width: "100%",
    maxWidth: "900px",
    marginBottom: "15px",
  },
  tabButton: {
    padding: "8px 10px",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    color: "#1e293b",
    fontSize: "13px",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  tabButtonActive: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
    borderColor: "#0284c7"
  },
  card: {
    width: "100%",
    maxWidth: "900px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    boxSizing: "border-box",
    color: "#1e293b"
  },
  tabContentHidden: { display: "none" },
  tabContentActive: { display: "block" },
  blockTitle: { fontSize: "18px", marginBottom: "10px", color: "#1e293b" },
  blockText: { fontSize: "13px", color: "#475569" },
  input: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    colorScheme: "light"
  },
  select: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    colorScheme: "light"
  },
  primaryButton: {
    padding: "10px 20px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "#0ea5e9",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold"
  },
  secondaryButton: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#1e293b"
  },
  monthHeader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    margin: "15px 0"
  },
  navButton: {
    padding: "5px 15px",
    borderRadius: "50%",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    color: "#1e293b",
    backgroundColor: "#ffffff"
  },
  monthTitle: { fontSize: "17px", fontWeight: "bold", color: "#1e293b" },
  weekdaysRow: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    textAlign: "center",
    marginBottom: "8px",
    color: "#1e293b"
  },
  weekdayCell: { fontWeight: "bold", fontSize: "13px" },
  daysGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" },
  dayCell: {
    aspectRatio: "1/1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    fontSize: "14px"
  },
  legendRow: {
    display: "flex",
    gap: "15px",
    marginTop: "15px",
    justifyContent: "center"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#1e293b"
  },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%" },
  lookupRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "15px",
    flexWrap: "wrap"
  },
  lookupMessage: { fontSize: "12px", color: "#0284c7", margin: 0 },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
    backgroundColor: "#f8fafc",
    padding: "15px",
    borderRadius: "12px"
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    fontSize: "13px",
    color: "#1e293b"
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #f1f5f9",
    color: "#1e293b",
    fontSize: "13px"
  },
  deleteTextButton: {
    border: "none",
    background: "none",
    color: "#ef4444",
    cursor: "pointer"
  },
  footer: {
    marginTop: "20px",
    fontSize: "11px",
    color: "#94a3b8"
  }
};