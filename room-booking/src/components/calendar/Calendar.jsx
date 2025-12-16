import React, { useEffect, useState } from "react";
import { format, addDays } from "date-fns";

import { db } from "../../services/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDocs
} from "firebase/firestore";

import "./calendar.css";

export default function Calendar({ onDateSelect }) {
  const [dates, setDates] = useState({});

  /* ------------------------------------------------
     1️⃣ CREATE NEXT 15 DAYS
  -------------------------------------------------*/
  useEffect(() => {
    const today = new Date();
    const map = {};

    for (let i = 0; i < 15; i++) {
      const d = addDays(today, i);
      const key = format(d, "yyyy-MM-dd");

      map[key] = {
        date: d,
        status: "available",
        dateStatus: null,
        dateChecked: false // 🔑 IMPORTANT
      };
    }

    setDates(map);
  }, []);

  /* ------------------------------------------------
     2️⃣ DATE STATUS (ADMIN – AUTHORITATIVE)
  -------------------------------------------------*/
  useEffect(() => {
    if (!Object.keys(dates).length) return;

    const unsubscribers = [];

    Object.keys(dates).forEach((dateKey) => {
      const dateRef = doc(db, "bookings", dateKey);

      const unsub = onSnapshot(dateRef, (snap) => {
        const dateStatus = snap.exists()
          ? snap.data().dateStatus || null
          : null;

        setDates((prev) => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            dateStatus,
            dateChecked: true, // ✅ mark as processed
            status:
              dateStatus === "blocked"
                ? "full"
                : dateStatus === "open"
                ? "available"
                : prev[dateKey].status
          }
        }));
      });

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((u) => u());
  }, [Object.keys(dates).length]);

  /* ------------------------------------------------
     3️⃣ SLOT COUNT (RUN ONLY AFTER DATE CHECK)
  -------------------------------------------------*/
  useEffect(() => {
    if (!Object.keys(dates).length) return;

    async function checkAvailability() {
      const updated = { ...dates };

      for (const dateKey of Object.keys(updated)) {
        const d = updated[dateKey];

        // 🚫 WAIT until date snapshot is done
        if (!d.dateChecked) continue;

        // 🔴 ADMIN BLOCK → NEVER OVERRIDE
        if (d.dateStatus === "blocked") {
          updated[dateKey].status = "full";
          continue;
        }

        // 🟢 ADMIN FORCE OPEN
        if (d.dateStatus === "open") {
          updated[dateKey].status = "available";
          continue;
        }

        const slotsRef = collection(db, "bookings", dateKey, "slots");
        const snap = await getDocs(slotsRef);

        let totalSlots = 0;
        let blockedSlots = 0;

        snap.forEach((doc) => {
          totalSlots++;
          const s = doc.data().status;
          if (s === "pending" || s === "confirmed") blockedSlots++;
        });

        updated[dateKey].status =
          totalSlots > 0 && blockedSlots === totalSlots
            ? "full"
            : "available";
      }

      setDates(updated);
    }

    checkAvailability();
  }, [Object.keys(dates).length]);

  /* ------------------------------------------------
     4️⃣ UI
  -------------------------------------------------*/
  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <h5>Select Date</h5>
        <div className="status-legend">
          <span className="legend-box available">Available</span>
          <span className="legend-box full">Full</span>
        </div>
      </div>

      <div className="date-card-grid">
        {Object.entries(dates).map(([key, d]) => (
          <div
            key={key}
            className={`date-card ${
              d.status === "full" ? "full-day" : "available-day"
            }`}
          >
            <div className="date-top">
              <div className="day-name">{format(d.date, "EEE")}</div>
              <div className="month-year">
                {format(d.date, "MMM yyyy")}
              </div>
            </div>

            <div className="date-number">{format(d.date, "dd")}</div>

            <button
              disabled={d.status === "full"}
              onClick={() => onDateSelect(key)}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
