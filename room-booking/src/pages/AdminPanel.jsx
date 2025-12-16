import React, { useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import AdminHotelConfig from "./adminhotelConfig";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import "../styles/global.css"
const ALL_SLOTS = [
  "02 AM","03 AM","04 AM","05 AM","06 AM","07 AM",
  "08 AM","09 AM","10 AM","11 AM",
  "12 PM","01 PM","02 PM","03 PM","04 PM","05 PM",
  "06 PM","07 PM","08 PM","09 PM","10 PM","11 PM"
];

export default function AdminPanel() {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  /* =====================================================
     DATE BLOCK / UNBLOCK
  ====================================================== */
  const blockDate = async () => {
    if (!date) return alert("Select date first");

    await setDoc(
      doc(db, "bookings", date),
      {
        dateStatus: "blocked",
        updatedAt: new Date()
      },
      { merge: true }
    );

    alert(`Date ${date} blocked`);
  };

  const unblockDate = async () => {
    if (!date) return alert("Select date first");

    await setDoc(
      doc(db, "bookings", date),
      {
        dateStatus: "open"
      },
      { merge: true }
    );

    alert(`Date ${date} unblocked`);
  };

  /* =====================================================
     SLOT BLOCK / UNBLOCK
  ====================================================== */
  const blockSlot = async () => {
  if (!date || !slot) {
    alert("Select date & slot");
    return;
  }

  const slotRef = doc(db, "bookings", date, "slots", slot);
  const snap = await getDoc(slotRef);

  // 🔐 If slot exists & payment already done → STOP
  if (snap.exists()) {
    const data = snap.data();

    if (data.transactionId) {
      alert("Cannot block this slot. Payment already completed.");
      return;
    }
  }

  // ✅ Safe to block
  await setDoc(
    slotRef,
    {
      status: "confirmed",
      phone: null,
      expiry: null,
      updatedAt: new Date()
    },
    { merge: true }
  );

  alert(`Slot ${slot} blocked on ${date}`);
};

  const unblockSlot = async () => {
    if (!date || !slot) return alert("Select date & slot");

    await setDoc(
      doc(db, "bookings", date, "slots", slot),
      {
        status: "available",
        phone: null,
        expiry: null
      },
      { merge: true }
    );

    alert(`Slot ${slot} unblocked on ${date}`);
  };
  const logout = () => {
      signOut(auth);
      window.location.href = "/admin/login";
    };

  return (
    <>
      <Header />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center">
  <h2 className="mb-4">Admin Control Panel</h2>

  <div className="d-flex gap-2">
    <button
      className="btn btn-primary"
      onClick={() => (window.location.href = "/admin/dashboard")}
    >
      Dashboard
    </button>

    <button className="btn btn-danger" onClick={logout}>
      Logout
    </button>
  </div>
</div>
</div>
  

      <div className="container mt-4">
        {/* ================= DATE CONTROL ================= */}
        <div className="card p-3 mb-4">
          <h5>Date Block / Unblock</h5>

          <input
            type="date"
            className="form-control mb-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="d-flex gap-2">
            <button className="btn btn-danger" onClick={blockDate}>
              Block Date
            </button>

            <button className="btn btn-success" onClick={unblockDate}>
              Unblock Date
            </button>
          </div>
        </div>

        {/* ================= SLOT CONTROL ================= */}
        <div className="card p-3 mb-4">
          <h5>Slot Block / Unblock</h5>

          <input
            type="date"
            className="form-control mb-3"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="form-select mb-3"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            <option value="">Select Slot</option>
            {ALL_SLOTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="d-flex gap-2">
            <button className="btn btn-danger" onClick={blockSlot}>
              Block Slot
            </button>

            <button className="btn btn-success" onClick={unblockSlot}>
              Unblock Slot
            </button>
          </div>
        </div>
           <AdminHotelConfig />
      </div>
      <Footer />
    </>
  );
}
