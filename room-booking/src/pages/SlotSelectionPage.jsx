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
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export default function SlotSelectionPage() {
  const selectedDate = localStorage.getItem("selectedDate");

  const [slotStatus, setSlotStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const amSlots = [
    "02 AM","03 AM","04 AM","05 AM","06 AM","07 AM",
    "08 AM","09 AM","10 AM","11 AM"
  ];

  const pmSlots = [
    "12 PM","01 PM","02 PM","03 PM","04 PM","05 PM",
    "06 PM","07 PM","08 PM","09 PM","10 PM","11 PM"
  ];

  /* ------------------------------------------------
     REDIRECT IF DATE NOT SELECTED
  -------------------------------------------------*/
  useEffect(() => {
    if (!selectedDate) window.location.href = "/";
  }, [selectedDate]);

  /* ------------------------------------------------
     CLEANUP EXPIRED PENDING SLOTS
  -------------------------------------------------*/
  async function cleanupExpiredSlots() {
    const ref = collection(db, "bookings", selectedDate, "slots");
    const snap = await getDocs(ref);
    const now = new Date();

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.status === "pending" && data.expiry?.toDate() < now) {
        await setDoc(
          doc(db, "bookings", selectedDate, "slots", docSnap.id),
          {
            status: "available",
            expiry: null
          },
          { merge: true }
        );
      }
    }
  }

  /* ------------------------------------------------
     LOAD SLOT STATUSES (ONLY EXISTING DOCS)
  -------------------------------------------------*/
  async function loadSlots() {
    const ref = collection(db, "bookings", selectedDate, "slots");
    const snapshot = await getDocs(ref);

    const statusMap = {};
    snapshot.forEach((docSnap) => {
      statusMap[docSnap.id] = docSnap.data().status;
    });

    setSlotStatus(statusMap);
  }

  /* ------------------------------------------------
     INIT
  -------------------------------------------------*/
  useEffect(() => {
    async function init() {
      setLoading(true);
      await cleanupExpiredSlots();
      await loadSlots();
      setLoading(false);
    }

    if (selectedDate) init();
  }, [selectedDate]);

  /* ------------------------------------------------
     SLOT TIME CONVERSION
  -------------------------------------------------*/
  const convertTo24 = (slot) => {
    const [hour, meridiem] = slot.split(" ");
    let h = parseInt(hour);

    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;

    return h;
  };

  /* ------------------------------------------------
     HANDLE SLOT CLICK → LOCK SLOT (NO PHONE HERE)
  -------------------------------------------------*/
  const handleSelectSlot = async (slot) => {
    const slotRef = doc(db, "bookings", selectedDate, "slots", slot);
    const snap = await getDoc(slotRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.status === "confirmed") {
        alert("This slot is already booked.");
        return;
      }

      if (data.status === "pending" && data.expiry?.toDate() > new Date()) {
        alert("This slot is currently being booked by another user.");
        return;
      }
    }

    // 🔒 Lock slot for 5 minutes
    const expiry = Timestamp.fromDate(
      new Date(Date.now() + 5 * 60 * 1000)
    );

    await setDoc(
      slotRef,
      {
        status: "pending",
        phone:null,
        expiry,
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    // Save booking info
    const checkinDateTime = new Date(selectedDate);
    checkinDateTime.setHours(convertTo24(slot), 0, 0, 0);

    const checkout = addHours(checkinDateTime, 23);

    localStorage.setItem("checkInSlot", slot);
    localStorage.setItem("checkOutDate", format(checkout, "yyyy-MM-dd"));
    localStorage.setItem("checkOutTime", format(checkout, "hh:mm a"));

    window.location.href = "/booking/hotels";
  };

  /* ------------------------------------------------
     UI HELPERS
  -------------------------------------------------*/
  const getSlotClass = (slot) => {
    const status = slotStatus[slot];
    if (status === "confirmed") return "full-slot";
    if (status === "pending") return "pending-slot";
    return "available-slot"; // 🟢 default
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
        <h3 className="slot-date">
          {format(parseISO(selectedDate), "dd MMM yyyy")}
        </h3>
        <p className="stay-info">23 Hours Stay</p>

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
