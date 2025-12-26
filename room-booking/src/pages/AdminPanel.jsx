import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { db, auth } from "../services/firebase";
import { deleteField } from "firebase/firestore";
import {
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import AdminHotelConfig from "./adminhotelConfig";

const ALL_SLOTS = [
  "02 AM","03 AM","04 AM","05 AM","06 AM","07 AM",
  "08 AM","09 AM","10 AM","11 AM",
  "12 PM","01 PM","02 PM","03 PM","04 PM","05 PM",
  "06 PM","07 PM","08 PM","09 PM","10 PM","11 PM"
];

export default function AdminPanel() {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [roomId, setRoomId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [priceDate, setPriceDate] = useState("");
  const [priceRoomId, setPriceRoomId] = useState("");
  const [priceValue, setPriceValue] = useState("");

  /* =====================================================
     LOAD ROOMS FROM CONFIG
  ===================================================== */
  useEffect(() => {
    async function loadRooms() {
      const snap = await getDoc(doc(db, "hotelConfig", "main"));
      if (snap.exists()) {
        setRooms(snap.data().rooms || []);
      }
    }
    loadRooms();
  }, []);

  /* =====================================================
     1️⃣ DATE CONTROL
  ===================================================== */
  const blockDate = async () => {
    if (!date) return alert("Select date first");

    await setDoc(
      doc(db, "bookings", date),
      { dateStatus: "blocked", updatedAt: new Date() },
      { merge: true }
    );

    alert(`Date ${date} blocked`);
  };

  const unblockDate = async () => {
    if (!date) return alert("Select date first");

    await setDoc(
      doc(db, "bookings", date),
      { dateStatus: "open", updatedAt: new Date() },
      { merge: true }
    );

    alert(`Date ${date} unblocked`);
  };

    /* =====================================================
     3️⃣ SINGLE ROOM CONTROL
  ===================================================== */
  const blockRoom = async () => {
    if (!date || !slot || !roomId)
      return alert("Select date, slot & room");

    const ref = doc(db, "bookings", date, "slots", slot, "rooms", roomId);
    const snap = await getDoc(ref);

    if (snap.exists() && snap.data().transactionId) {
      alert("Cannot block paid room");
      return;
    }

    await setDoc(
      ref,
      {
        status: "confirmed",
        blockedBy: "admin",
        updatedAt: new Date()
      },
      { merge: true }
    );

    alert("Room blocked");
  };

  const unblockRoom = async () => {
    if (!date || !slot || !roomId)
      return alert("Select date, slot & room");

    const ref = doc(db, "bookings", date, "slots", slot, "rooms", roomId);
    const snap = await getDoc(ref);

    if (snap.exists() && snap.data().transactionId) {
      alert("Paid room cannot be unblocked");
      return;
    }

    await setDoc(
      ref,
      { status: "available", blockedBy: null },
      { merge: true }
    );

    alert("Room unblocked");
  };

  const logout = async () => {
    await signOut(auth);
    window.location.href = "/admin/login";
  };
  
/*overprice */
  const saveRoomPriceOverride = async () => {
  if (!priceDate || !priceRoomId || !priceValue) {
    alert("Select date, room and price");
    return;
  }

  await setDoc(
    doc(db, "datePricing", priceDate),
    {
      rooms: {
        [priceRoomId]: Number(priceValue)
      },
      updatedAt: new Date()
    },
    { merge: true }
  );

  alert("Room price overridden for selected date");
  setPriceValue("");
};

const removeRoomPriceOverride = async () => {
  if (!priceDate || !priceRoomId) {
    alert("Select date & room");
    return;
  }

  await setDoc(
    doc(db, "datePricing", priceDate),
    {
      rooms: {
        [priceRoomId]: deleteField()
      },
      updatedAt: new Date()
    },
    { merge: true }
  );

  alert("Room price override removed");
};

  return (
    <>
      <Header />

      <div className="container mt-4">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center">
          <h2>Admin Control Panel</h2>
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

        {/* DATE CONTROL */}
        <div className="card p-3 mt-4">
          <h5>Date Blocking</h5>
          <input
            type="date"
            className="form-control mb-2"
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

        {/* ROOM CONTROL */}
        <div className="card p-3 mt-4">
          <h5>Room Blocking</h5>

          <input
            type="date"
            className="form-control mb-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <select
            className="form-select mb-2"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            <option value="">Select Slot</option>
            {ALL_SLOTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="form-select mb-2"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            <option value="">Select Room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.type} – {r.persons} Persons
              </option>
            ))}
          </select>

          <div className="d-flex gap-2">
            <button className="btn btn-danger" onClick={blockRoom}>
              Block Room
            </button>
            <button className="btn btn-success" onClick={unblockRoom}>
              Unblock Room
            </button>
          </div>
        </div>
        
        {/* ROOM PRICE OVERRIDE */}
        <div className="card p-3 mt-4">
          <h5>Date-wise Room Price Override</h5>

          <input
            type="date"
            className="form-control mb-2"
            value={priceDate}
            onChange={(e) => setPriceDate(e.target.value)}
          />

          <select
            className="form-select mb-2"
            value={priceRoomId}
            onChange={(e) => setPriceRoomId(e.target.value)}
          >
            <option value="">Select Room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.type} – {r.persons} Persons (₹{r.price})
              </option>
            ))}
          </select>

          <input
            type="number"
            className="form-control mb-2"
            placeholder="Override Price"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
          />

          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={saveRoomPriceOverride}>
              Save Price
            </button>
            <button className="btn btn-secondary" onClick={removeRoomPriceOverride}>
              Remove Override
            </button>
          </div>
        </div>

        {/* HOTEL CONFIG */}
        <AdminHotelConfig />
      </div>

      <Footer />
    </>
  );
}
