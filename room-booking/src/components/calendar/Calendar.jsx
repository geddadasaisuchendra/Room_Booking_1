import React, { useEffect, useState } from "react";
import { format, addDays } from "date-fns";

import { db } from "../../services/firebase";
import { collection, getDocs } from "firebase/firestore";

import "./calendar.css";

export default function Calendar({ onDateSelect }) {
  const [dates, setDates] = useState([]);

  /* ------------------------------------------------
     1️⃣ CREATE 15 DAYS INSTANTLY (NO WAITING)
  -------------------------------------------------*/
  useEffect(() => {
    const today = new Date();
    const list = [];

    for (let i = 0; i < 15; i++) {
      const d = addDays(today, i);
      list.push({
        date: d,
        key: format(d, "yyyy-MM-dd"),
        status: "available" // default GREEN
      });
    }

    setDates(list);
  }, []);

  /* ------------------------------------------------
     2️⃣ BACKGROUND CHECK → MARK FULL DAYS
     🔴 ONLY WHEN ALL SLOTS ARE BLOCKED
  -------------------------------------------------*/
  useEffect(() => {
    if (!dates.length) return;

    async function checkAvailability() {
      const updated = [...dates];

      for (let i = 0; i < updated.length; i++) {
        const dateKey = updated[i].key;

        const slotsRef = collection(db, "bookings", dateKey, "slots");
        const snap = await getDocs(slotsRef);

        let totalSlots = 0;
        let blockedSlots = 0;

        snap.forEach((doc) => {
          totalSlots++;
          const s = doc.data().status;
          if (s === "pending" || s === "confirmed") {
            blockedSlots++;
          }
        });

        // 🔴 Mark FULL only if ALL slots are blocked
        if (totalSlots > 0 && blockedSlots === totalSlots) {
          updated[i].status = "full";
        }
      }

      setDates(updated);
    }

    checkAvailability();
  }, [dates.length]);

  /* ------------------------------------------------
     3️⃣ RENDER UI
  -------------------------------------------------*/
  return (
    <div className="calendar-card">
      {/* HEADER */}
      <div className="calendar-header">
        <h5>Select Date</h5>

        <div className="status-legend">
          <span className="legend-box available">Available</span>
          <span className="legend-box full">Full</span>
        </div>
      </div>

      {/* DATE GRID */}
      <div className="date-card-grid">
        {dates.map((d) => (
          <div
            key={d.key}
            className={`date-card ${
              d.status === "full" ? "full-day" : "available-day"
            }`}
          >
            {/* TOP */}
            <div className="date-top">
              <div className="day-name">
                {format(d.date, "EEE")}
              </div>
              <div className="month-year">
                {format(d.date, "MMM-yyyy")}
              </div>
            </div>

            {/* DATE */}
            <div className="date-number">
              {format(d.date, "dd")}
            </div>

            {/* ACTION */}
            <button
              disabled={d.status === "full"}
              onClick={() => onDateSelect(d.key)}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
