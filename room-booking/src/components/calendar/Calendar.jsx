import React, { useEffect, useState } from "react";
import { format, addDays } from "date-fns";

import { db } from "../../services/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDocs,
  getDoc
} from "firebase/firestore";

import "./calendar.css";

const TOTAL_SLOTS = 22;

export default function Calendar({ onDateSelect }) {
  const [dates, setDates] = useState({});
  const [totalRooms, setTotalRooms] = useState(0);

  /* ------------------------------------------------
     0️⃣ LOAD TOTAL ROOMS (ADMIN CONFIG)
  -------------------------------------------------*/
  useEffect(() => {
    async function loadRooms() {
      const snap = await getDoc(doc(db, "hotelConfig", "main"));
      if (snap.exists()) {
        setTotalRooms((snap.data().rooms || []).length);
      }
    }
    loadRooms();
  }, []);

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
        availableRooms: 0,
        dateStatus: null,
        dateChecked: false
      };
    }

    setDates(map);
  }, []);

  /* ------------------------------------------------
     2️⃣ DATE STATUS (ADMIN – AUTHORITATIVE)
  -------------------------------------------------*/
  useEffect(() => {
    if (!Object.keys(dates).length) return;

    const unsubs = [];

    Object.keys(dates).forEach((dateKey) => {
      const ref = doc(db, "bookings", dateKey);

      const unsub = onSnapshot(ref, (snap) => {
        const dateStatus = snap.exists()
          ? snap.data().dateStatus || null
          : null;

        setDates((prev) => ({
          ...prev,
          [dateKey]: {
            ...prev[dateKey],
            dateStatus,
            dateChecked: true
          }
        }));
      });

      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [Object.keys(dates).length]);

  /* ------------------------------------------------
     3️⃣ ROOM AVAILABILITY COUNT (USER BOOKINGS)
  -------------------------------------------------*/
  useEffect(() => {
    if (!Object.keys(dates).length || totalRooms === 0) return;

    async function calculateAvailability() {
      const updated = { ...dates };
      const bookingsSnap = await getDocs(collection(db, "userBookings"));

      for (const dateKey of Object.keys(updated)) {
        const d = updated[dateKey];

        if (!d.dateChecked) continue;

        // 🔴 ADMIN BLOCK
        if (d.dateStatus === "blocked") {
          updated[dateKey].status = "full";
          updated[dateKey].availableRooms = 0;
          continue;
        }

        const totalCapacity = totalRooms * TOTAL_SLOTS;
        let booked = 0;

        bookingsSnap.forEach((b) => {
          const data = b.data();
          if (data.date === dateKey && data.status === "success") {
            booked++;
          }
        });

        const available = Math.max(totalCapacity - booked, 0);

        updated[dateKey].availableRooms = available;
        updated[dateKey].status =
          available === 0 ? "full" : "available";
      }

      setDates(updated);
    }

    calculateAvailability();
  }, [totalRooms, Object.keys(dates).length]);

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

            <div className="date-number">
              {format(d.date, "dd")}
            </div>

            <div className="room-count">
              {d.status === "full"
                ? "No Rooms"
                : `${d.availableRooms} Rooms Left`}
            </div>

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
