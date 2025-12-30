import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./slot.css";
import { format, addHours, parseISO } from "date-fns";

import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";

export default function SlotSelectionPage() {
  const selectedDate = localStorage.getItem("selectedDate");
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentHour = now.getHours();
  
  const [slotStatus, setSlotStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalRooms, setTotalRooms] = useState(0);

  const amSlots = [
    "02 AM","03 AM","04 AM","05 AM","06 AM","07 AM",
    "08 AM","09 AM","10 AM","11 AM"
  ];

  const pmSlots = [
    "12 PM","01 PM","02 PM","03 PM","04 PM","05 PM",
    "06 PM","07 PM","08 PM","09 PM","10 PM","11 PM"
  ];

  /* -----------------------------
     SAFETY REDIRECT
  ----------------------------- */
  useEffect(() => {
    if (!selectedDate) window.location.href = "/";
  }, [selectedDate]);

  /* -----------------------------
     LOAD TOTAL ROOMS
  ----------------------------- */
  useEffect(() => {
    async function loadRoomCount() {
      const snap = await getDoc(doc(db, "hotelConfig", "main"));
      if (snap.exists()) {
        setTotalRooms((snap.data().rooms || []).length);
      }
    }
    loadRoomCount();
  }, []);

  /* -----------------------------
     LOAD SLOT AVAILABILITY
     (OPTIMIZED – PARALLEL READS)
  ----------------------------- */
  useEffect(() => {
    if (!selectedDate || totalRooms === 0) return;

    async function loadSlots() {
      setLoading(true);

      const statusMap = {};
      const allSlots = [...amSlots, ...pmSlots];

      // 1️⃣ Fetch user bookings ONCE
      const bookingsSnap = await getDocs(collection(db, "userBookings"));

      // 2️⃣ Fetch all admin room blocks IN PARALLEL
      const adminRoomPromises = allSlots.map((slot) =>
        getDocs(
          collection(db, "bookings", selectedDate, "slots", slot, "rooms")
        )
      );

      const adminRoomResults = await Promise.all(adminRoomPromises);

      allSlots.forEach((slot, index) => {
        let blockedRooms = 0;

        /* -------- ADMIN BLOCKED ROOMS -------- */
        adminRoomResults[index].forEach((r) => {
          if (r.data().blockedBy === "admin") {
            blockedRooms++;
          }
        });

        /* -------- USER SUCCESS BOOKINGS -------- */
        bookingsSnap.forEach((bSnap) => {
          const b = bSnap.data();

          if (
            b.date === selectedDate &&
            b.selectedSlot === slot &&
            b.status === "success"
          ) {
            blockedRooms++;
          }
        });

        statusMap[slot] =
          blockedRooms >= totalRooms ? "full" : "available";
      });

      setSlotStatus(statusMap);
      setLoading(false);
    }

    loadSlots();
  }, [selectedDate, totalRooms]);

  /* -----------------------------
     SLOT TIME CONVERSION
  ----------------------------- */
  const convertTo24 = (slot) => {
    const [hour, meridiem] = slot.split(" ");
    let h = parseInt(hour);

    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;

    return h;
  };

  /* -----------------------------
     SLOT SELECT
  ----------------------------- */
  const handleSelectSlot = (slot) => {
    if (slotStatus[slot] === "full") {
      alert("All rooms are unavailable for this slot.");
      return;
    }

    const checkinDateTime = new Date(selectedDate);
    checkinDateTime.setHours(convertTo24(slot), 0, 0, 0);

    const checkout = addHours(checkinDateTime, 23);

    localStorage.setItem("checkInSlot", slot);
    localStorage.setItem("checkOutDate", format(checkout, "yyyy-MM-dd"));
    localStorage.setItem("checkOutTime", format(checkout, "hh:mm a"));

    window.location.href = "/booking/hotels";
  };

  /* -----------------------------
     UI HELPERS
  ----------------------------- */
  const getSlotClass = (slot) =>
    slotStatus[slot] === "full" ? "full-slot" : "available-slot";

  const visibleAmSlots =
  selectedDate === todayStr
    ? amSlots.filter((slot) => convertTo24(slot) > currentHour)
    : amSlots;

const visiblePmSlots =
  selectedDate === todayStr
    ? pmSlots.filter((slot) => convertTo24(slot) > currentHour)
    : pmSlots;

  return (
    <body class="d-flex flex-column min-vh-100">
      <Header />
       <div className="flex-fill mt-5">
      <div className="slot-container">
        <h2 className="slot-title">Check In Slot Availability</h2>
        <h3 className="slot-date">
          {format(parseISO(selectedDate), "dd MMM yyyy")}
        </h3>
        <p className="stay-info">23 Hours Stay</p>

        {loading && <p style={{ textAlign: "center" }}>Loading slots...</p>}

        {!loading && (
          <>
            {visibleAmSlots.length > 0 && (
                    <>
                      <h4 className="slot-group-title">AM</h4>
                      <div className="slot-grid">
                        {visibleAmSlots.map((slot) => (
                          <button
                            key={slot}
                            className={`slot-btn ${getSlotClass(slot)}`}
                            disabled={slotStatus[slot] === "full"}
                            onClick={() => handleSelectSlot(slot)}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </>
                  )}


            {visiblePmSlots.length > 0 && (
                <>
                  <h4 className="slot-group-title">PM</h4>
                  <div className="slot-grid">
                    {visiblePmSlots.map((slot) => (
                      <button
                        key={slot}
                        className={`slot-btn ${getSlotClass(slot)}`}
                        disabled={slotStatus[slot] === "full"}
                        onClick={() => handleSelectSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </>
              )}

          </>
        )}
      </div>
       </div>
      <div className="slot-footer mt-auto">
      <Footer />
      </div>
    </body>
  );
}
