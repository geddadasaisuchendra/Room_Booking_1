import React, { useState, useEffect } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./slot.css";
import { format, addHours, parseISO } from "date-fns";

import { db } from "../services/firebase";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export default function SlotSelectionPage() {
  const selectedDate = localStorage.getItem("selectedDate");
  const phone = localStorage.getItem("userPhone"); // user phone (required)

  const [slotStatus, setSlotStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const amSlots = [
    "02 AM", "03 AM", "04 AM", "05 AM", "06 AM", "07 AM",
    "08 AM", "09 AM", "10 AM", "11 AM"
  ];

  const pmSlots = [
    "12 PM", "01 PM", "02 PM", "03 PM", "04 PM", "05 PM",
    "06 PM", "07 PM", "08 PM", "09 PM", "10 PM", "11 PM"
  ];

  /* -----------------------------------------
     REDIRECT IF DATE NOT SELECTED
  ------------------------------------------ */
  useEffect(() => {
    if (!selectedDate) window.location.href = "/";
  }, [selectedDate]);

  /* -----------------------------------------
     AUTO-CREATE slots in Firestore
  ------------------------------------------ */
  async function ensureSlotsExist(date) {
    const allSlots = [...amSlots, ...pmSlots];

    for (let slot of allSlots) {
      const slotRef = doc(db, "bookings", date, "slots", slot);
      const snap = await getDoc(slotRef);

      if (!snap.exists()) {
        await setDoc(slotRef, {
          status: "available",
          phone: null,
          expiry: null
        });
      }
    }
  }

  /* -----------------------------------------
     AUTO-REMOVE EXPIRED pending slots
  ------------------------------------------ */
  async function cleanupExpiredSlots() {
    const ref = collection(db, "bookings", selectedDate, "slots");
    const snap = await getDocs(ref);

    const now = new Date();

    for (const item of snap.docs) {
      const data = item.data();

      if (data.status === "pending" && data.expiry) {
        if (data.expiry.toDate() < now) {
          // EXPIRED → make available again
          await setDoc(
            doc(db, "bookings", selectedDate, "slots", item.id),
            {
              status: "available",
              phone: null,
              expiry: null
            },
            { merge: true }
          );
        }
      }
    }
  }

  /* -----------------------------------------
     LOAD SLOT STATUSES FROM DB
  ------------------------------------------ */
  async function loadSlots() {
    const ref = collection(db, "bookings", selectedDate, "slots");
    const snapshot = await getDocs(ref);

    const status = {};
    snapshot.forEach((docSnap) => {
      status[docSnap.id] = docSnap.data().status;
    });

    setSlotStatus(status);
  }

  /* -----------------------------------------
     INIT: create slots + clear expired + load
  ------------------------------------------ */
  useEffect(() => {
    async function init() {
      if (!selectedDate) return;

      setLoading(true);
      await ensureSlotsExist(selectedDate);
      await cleanupExpiredSlots();  // 🔥 VERY IMPORTANT
      await loadSlots();
      setLoading(false);
    }

    init();
  }, [selectedDate]);

  /* -----------------------------------------
     SLOT TIME CONVERSION
  ------------------------------------------ */
  const convertTo24 = (slot) => {
    const [hour, meridiem] = slot.split(" ");
    let h = parseInt(hour);

    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;

    return h;
  };

  /* -----------------------------------------
     HANDLE SLOT CLICK → LOCK SLOT PENDING
  ------------------------------------------ */
  const handleSelectSlot = async (slot) => {
    if (!phone) {
      alert("Please enter your phone number before booking.");
      window.location.href = "/booking/phone";
      return;
    }

    const slotRef = doc(db, "bookings", selectedDate, "slots", slot);
    const snap = await getDoc(slotRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.status === "confirmed") {
        alert("This slot is already booked.");
        return;
      }

      // Check if pending but NOT expired
      if (data.status === "pending" && data.expiry) {
        const expiryTime = data.expiry.toDate();
        if (expiryTime > new Date()) {
          alert("This slot is being booked by another user.");
          return;
        }
      }
    }

    // ✔ Lock slot for 5 minutes
    const expiryTime = Timestamp.fromDate(
      new Date(Date.now() + 5 * 60 * 1000)
    );

    await setDoc(
      slotRef,
      {
        status: "pending",
        phone,
        expiry: expiryTime,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    // Store slot & checkout in localStorage
    const checkinDateTime = new Date(selectedDate);
    checkinDateTime.setHours(convertTo24(slot), 0, 0, 0);

    const checkout = addHours(checkinDateTime, 23);

    localStorage.setItem("checkInSlot", slot);
    localStorage.setItem("checkOutDate", format(checkout, "yyyy-MM-dd"));
    localStorage.setItem("checkOutTime", format(checkout, "hh:mm a"));

    // Redirect to hotel list page
    window.location.href = "/booking/hotels";
  };

  /* -----------------------------------------
     UI HELPERS
  ------------------------------------------ */
  const getSlotClass = (slot) => {
    const status = slotStatus[slot];
    if (status === "confirmed") return "full-slot";
    if (status === "pending") return "pending-slot";
    return "available-slot";
  };

  const isDisabled = (slot) => {
    const status = slotStatus[slot];
    return status === "pending" || status === "confirmed";
  };

  return (
    <>
      <Header />

      <div className="slot-container">
        <h2 className="slot-title">Check In Slot Availability</h2>
        <h3 className="slot-date">{format(parseISO(selectedDate), "dd MMM yyyy")}</h3>
        <p className="stay-info">23 Hours Stay</p>

        <div className="change-date-card">
          <div>📅 Change Date</div>
          <small>[ {format(parseISO(selectedDate), "yyyy - MMM do")} ]</small>
        </div>

        {loading && <p style={{ textAlign: "center" }}>Loading slots...</p>}

        {!loading && (
          <>
            <h4 className="slot-group-title">AM</h4>
            <div className="slot-grid">
              {amSlots.map((slot) => (
                <button
                  key={slot}
                  className={`slot-btn ${getSlotClass(slot)}`}
                  disabled={isDisabled(slot)}
                  onClick={() => handleSelectSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>

            <h4 className="slot-group-title">PM</h4>
            <div className="slot-grid">
              {pmSlots.map((slot) => (
                <button
                  key={slot}
                  className={`slot-btn ${getSlotClass(slot)}`}
                  disabled={isDisabled(slot)}
                  onClick={() => handleSelectSlot(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
