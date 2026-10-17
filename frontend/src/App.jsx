
import { useState } from "react";
import "./App.css";

const TIMES = [
  "09:00 AM", "09:30 AM", "10:00 AM",
  "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM",
  "03:30 PM", "04:00 PM"
];

const today = new Date();
const localDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

function App() {
  const [form, setForm] = useState({
    name: "",
    patientId: "",
    date: localDate(tomorrow),
    time: "09:00 AM",
    reason: "General consultation"
  });

  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("n2a-bookings") || "[]");
    } catch {
      return [];
    }
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const notify = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  const saveBookings = (updated) => {
    setBookings(updated);
    localStorage.setItem("n2a-bookings", JSON.stringify(updated));
  };

  const bookAppointment = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.patientId.trim()) {
      notify("Please enter the patient's name and ID.", "error");
      return;
    }

    if (form.date < localDate(today)) {
      notify("Choose today or a future date.", "error");
      return;
    }

    const conflict = bookings.some(
      (b) => b.date === form.date && b.time === form.time
    );

    if (conflict) {
      notify("That slot is already booked. Please select another.", "error");
      return;
    }

    const booking = {
      ...form,
      name: form.name.trim(),
      patientId: form.patientId.trim(),
      id: `APT-${Date.now().toString().slice(-8)}`,
      status: "Pending automation",
      createdAt: new Date().toISOString()
    };

    saveBookings([booking, ...bookings]);
    setForm({
      ...form,
      name: "",
      patientId: "",
      time: TIMES.find(
        (t) => ![...bookings, booking].some(
          (b) => b.date === form.date && b.time === t
        )
      ) || TIMES[0]
    });

    notify(`Booking ${booking.id} created! Export it for UiPath processing.`);
  };

  const exportCsv = () => {
    if (!bookings.length) {
      notify("Create a booking before exporting.", "error");
      return;
    }

    const columns = [
      "id", "name", "patientId", "date",
      "time", "reason", "status", "createdAt"
    ];

    const quote = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      columns.join(","),
      ...bookings.map((b) => columns.map((c) => quote(b[c])).join(","))
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "appointment_queue.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("CSV exported. Next, process it using the UiPath workflow.");
  };

  const cancelBooking = (id) => {
    saveBookings(bookings.filter((b) => b.id !== id));
    notify("Booking removed from the local list.");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">✚</span>
          <span>Notice<span className="accent">2</span>Action</span>
        </a>
        <span className="demo-label">AUTOMATION DESK</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">SMART CLINIC WORKFLOW</p>
          <h1>Care starts with<br /><span>better coordination.</span></h1>
          <p className="hero-description">
            Schedule appointments, prevent double-bookings and prepare
            records for automated processing.
          </p>
          <div className="hero-note">✦ Demo mode · Synthetic data only</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="medical-card">
            <div className="medical-symbol">✚</div>
            <div className="art-line long"></div>
            <div className="art-line short"></div>
            <div className="art-bottom">
              <span>APPOINTMENT</span><span className="art-check">✓</span>
            </div>
          </div>
          <div className="floating-dot dot-one"></div>
          <div className="floating-dot dot-two"></div>
        </div>
      </section>

      <section className="stats">
        <div className="stat-card">
          <span className="stat-icon">▤</span>
          <div><p>Total bookings</p><strong>{bookings.length}</strong></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon amber">◷</span>
          <div><p>Upcoming</p><strong>{bookings.filter(
            b => b.date >= localDate(today)
          ).length}</strong></div>
        </div>
        <div className="stat-card">
          <span className="stat-icon violet">⚙</span>
          <div><p>Awaiting automation</p><strong>{bookings.filter(
            b => b.status === "Pending automation"
          ).length}</strong></div>
        </div>
      </section>

      <section className="workspace">
        <div className="panel booking-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">NEW RESERVATION</p>
              <h2>Book an appointment</h2>
            </div>
            <span className="step-badge">01</span>
          </div>

          <form onSubmit={bookAppointment}>
            <label>
              Patient name
              <input name="name" value={form.name} onChange={update}
                placeholder="e.g. Alex Morgan" required maxLength={80} />
            </label>

            <label>
              Demo patient ID
              <input name="patientId" value={form.patientId} onChange={update}
                placeholder="e.g. DEMO-001" required maxLength={30} />
            </label>

            <div className="form-row">
              <label>
                Appointment date
                <input type="date" name="date" value={form.date}
                  min={localDate(today)} onChange={update} required />
              </label>
              <label>
                Time slot
                <select name="time" value={form.time} onChange={update}>
                  {TIMES.map((time) => {
                    const taken = bookings.some(
                      b => b.date === form.date && b.time === time
                    );
                    return (
                      <option key={time} value={time} disabled={taken}>
                        {time}{taken ? " — Booked" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>

            <label>
              Appointment type
              <select name="reason" value={form.reason} onChange={update}>
                <option>General consultation</option>
                <option>Routine check-up</option>
                <option>Follow-up visit</option>
                <option>Dental consultation</option>
              </select>
            </label>

            {message && (
              <div className={`message ${messageType}`} role="status">
                {message}
              </div>
            )}

            <button className="primary-button" type="submit">
              Create booking <span>→</span>
            </button>
            <p className="privacy-note">
              Demo only. No real patient records or notifications are used.
            </p>
          </form>
        </div>

        <div className="panel list-panel">
          <div className="panel-heading list-heading">
            <div>
              <p className="eyebrow">LIVE REGISTER</p>
              <h2>Appointment queue</h2>
              <p className="subheading">Bookings saved in this browser</p>
            </div>
            <span className="count-badge">{bookings.length}</span>
          </div>

          <div className="queue-toolbar">
            <span>YOUR BOOKINGS</span>
            <button className="export-button" onClick={exportCsv}>
              ↓ Export CSV
            </button>
          </div>

          <div className="booking-list">
            {bookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h3>Your queue is clear</h3>
                <p>Create a demo booking to see it appear here.</p>
              </div>
            ) : bookings.map((b) => (
              <article className="booking-item" key={b.id}>
                <div className="booking-avatar">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div className="booking-info">
                  <strong>{b.name}</strong>
                  <span>{b.id} · {b.patientId}</span>
                  <span>{b.date} · {b.time}</span>
                  <span className="status">{b.status}</span>
                </div>
                <button className="remove-button"
                  onClick={() => cancelBooking(b.id)}
                  aria-label={`Remove booking for ${b.name}`}
                  title="Remove booking">×</button>
              </article>
            ))}
          </div>

          <div className="automation-note">
            <span className="automation-icon">⚙</span>
            <div>
              <strong>UiPath processing</strong>
              <p>Export the queue, then let the robot validate records and
                generate confirmation messages.</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <span>Notice2Action <span className="footer-dot">●</span> Design2Deploy 2026</span>
        <span>Prototype · Synthetic data only</span>
      </footer>
    </main>
  );
}

export default App;
