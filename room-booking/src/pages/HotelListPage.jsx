import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./hotel.css";
import room1 from "../../src/assets/img1.jpeg";
import { format, parseISO } from "date-fns";
import { deleteField } from "firebase/firestore"; // (optional if already used)

import { db } from "../services/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export default function HotelListPage() {
  const selectedDate = localStorage.getItem("selectedDate");
  const checkInSlot = localStorage.getItem("checkInSlot");
  const checkOutDate = localStorage.getItem("checkOutDate");
  const checkOutTime = localStorage.getItem("checkOutTime");

  const [rooms, setRooms] = useState([]);
  const [roomStatus, setRoomStatus] = useState({}); // roomId → pending | booked
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [phone, setPhone] = useState("");
  const [datePrices, setDatePrices] = useState({});

  /* ----------------------------------
     SAFETY CHECK
  ---------------------------------- */
  useEffect(() => {
    if (!selectedDate || !checkInSlot) {
      window.location.href = "/";
    }
  }, [selectedDate, checkInSlot]);

  /* ----------------------------------
     LOAD ROOMS (ADMIN CONFIG)
  ---------------------------------- */
  useEffect(() => {
    async function loadRooms() {
      const ref = doc(db, "hotelConfig", "main");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setRooms(snap.data().rooms || []);
      }
    }
    loadRooms();
  }, []);

  /* ----------------------------------
   LOAD DATE-WISE ROOM PRICE OVERRIDE
---------------------------------- */
useEffect(() => {
  async function loadDatePrices() {
    if (!selectedDate) return;

    const snap = await getDoc(doc(db, "datePricing", selectedDate));
    if (snap.exists()) {
      setDatePrices(snap.data().rooms || {});
    } else {
      setDatePrices({});
    }
  }

  loadDatePrices();
}, [selectedDate]);

  /* ----------------------------------
     LOAD ROOM STATUS
     Priority:
     1️⃣ Admin block
     2️⃣ User success
     3️⃣ User pending (not expired)
  ---------------------------------- */
  function slotToDateTime(dateStr, slotStr) {
  const [hourStr, meridiem] = slotStr.split(" ");
  let hour = parseInt(hourStr, 10);

  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  const d = new Date(dateStr);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function checkoutToDateTime(dateStr, timeStr) {
  return new Date(`${dateStr} ${timeStr}`);
}

  useEffect(() => {
  if (!rooms.length) return;

  async function loadRoomStatus() {
    const now = new Date();
    const statusMap = {};

    const newCheckInDT = slotToDateTime(selectedDate, checkInSlot);

    // 🔹 Get all user bookings once
    const bookingsSnap = await getDocs(collection(db, "userBookings"));

    for (const room of rooms) {
      statusMap[room.id] = undefined; // default = available

      /* ---------- ADMIN BLOCK CHECK ---------- */
      const adminRoomRef = doc(
        db,
        "bookings",
        selectedDate,
        "slots",
        checkInSlot,
        "rooms",
        room.id
      );

      const adminRoomSnap = await getDoc(adminRoomRef);

      if (
        adminRoomSnap.exists() &&
        adminRoomSnap.data().blockedBy === "admin"
      ) {
        statusMap[room.id] = "booked";
        continue;
      }

      /* ---------- USER BOOKINGS + OVERLAP CHECK ---------- */
      for (const docSnap of bookingsSnap.docs) {
        const b = docSnap.data();

        // Only confirmed bookings block inventory
        if (b.status !== "success") continue;

        // Only same physical room
        if (String(b.roomId) !== String(room.id)) continue;

        // --- SAME SLOT BLOCK ---
        if (
          b.date === selectedDate &&
          b.selectedSlot === checkInSlot
        ) {
          statusMap[room.id] = "booked";
          break;
        }

        // --- 🔴 CROSS-DAY OVERLAP BLOCK ---
        if (b.checkOutDate && b.checkOutTime) {
          const existingCheckOutDT = checkoutToDateTime(
            b.checkOutDate,
            b.checkOutTime
          );

          // If new check-in is before old checkout → still occupied
          if (newCheckInDT < existingCheckOutDT) {
            statusMap[room.id] = "booked";
            break;
          }
        }
      }
    }

    setRoomStatus(statusMap);
  }

  loadRoomStatus();
}, [rooms, selectedDate, checkInSlot]);


  /* ----------------------------------
     OPEN BOOKING MODAL
  ---------------------------------- */
  const handleBookClick = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  /* ----------------------------------
     CREATE ROOM-LEVEL PENDING BOOKING
  ---------------------------------- */
  const handlePhoneSubmit = async () => {
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    const tempId = `temp_${Date.now()}`;

    await setDoc(doc(db, "userBookings", tempId), {
      phone,
      hotelName: "BHEEMA GRAND RESIDENCY",

      roomId: selectedRoom.id,
      roomType: selectedRoom.type,
      persons: selectedRoom.persons,
      price: getRoomPrice(selectedRoom),

      date: selectedDate,
      selectedSlot: checkInSlot,
      checkOutDate,
      checkOutTime,

      status: "pending",
      expiry: Timestamp.fromDate(
        new Date(Date.now() + 5 * 60 * 1000)
      ),
      createdAt: serverTimestamp()
    });

    localStorage.setItem("userPhone", phone);
    localStorage.setItem("selectedHotelName", "BHEEMA GRAND RESIDENCY");
    localStorage.setItem("selectedHotelType", selectedRoom.type);
    localStorage.setItem("selectedHotelPersons", selectedRoom.persons);
    localStorage.setItem("selectedHotelPrice",  getRoomPrice(selectedRoom));
    localStorage.setItem("selectedRoomId", selectedRoom.id);
    localStorage.setItem("tempBookingId", tempId);

    window.location.href = "/booking";
  };

  /* ----------------------------------
     UI HELPERS
  ---------------------------------- */
  const isDisabled = (roomId) =>
    roomStatus[roomId] === "pending" ||
    roomStatus[roomId] === "booked";

  const getTooltip = (roomId) =>
    roomStatus[roomId] === "pending"
      ? "Room is being booked by another user"
      : roomStatus[roomId] === "booked"
      ? "Room already booked"
      : "";

  const getRoomPrice = (room) => {
   return datePrices[room.id] ?? room.price;
  };

  return (
    <>
      <Header />

      <div className="hotel-container">
        <h2 className="slot-title">Check In Slot Availability</h2>

        <h3 className="slot-date">
          {format(parseISO(selectedDate), "dd MMM yyyy")} – {checkInSlot}
        </h3>

        <p className="checkout-text">
          Checkout By {format(parseISO(checkOutDate), "dd MMM yyyy")}{" "}
          {checkOutTime}
        </p>

        <div className="hotel-layout">
          <div className="hotel-image">
            <img src={room1} alt="Hotel Room" />
          </div>

          <div className="room-list">
            <h3>BHEEMA GRAND RESIDENCY</h3>

            {rooms.length === 0 && <p>No room types available</p>}

            {rooms.map((room) => (
              <div key={room.id} className="room-card-horizontal">
                <div className="room-left">
                  <div className="room-persons">
                    {room.persons} Persons
                  </div>
                  <div className="room-type">{room.type}</div>
                </div>

                <div className="room-right">
                  <div className="room-price">
                    ₹{getRoomPrice(room)}/-
                  </div>

                  <button
                    className="book-now-btn"
                    disabled={isDisabled(room.id)}
                    title={getTooltip(room.id)}
                    onClick={() => handleBookClick(room)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PHONE MODAL */}
      {showModal && selectedRoom && (
        <div className="modal-overlay">
          <div className="booking-modal">
            <button
              className="close-btn"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>

            <h3 className="hotel-titleModal">
              BHEEMA GRAND RESIDENCY
            </h3>
            <p className="hotel-typeModal">
              {selectedRoom.type}
            </p>

            <div className="modal-info">
              <div>
                <b>Check-In:</b>
                <p>
                  {format(parseISO(selectedDate), "dd MMM yyyy")} –{" "}
                  {checkInSlot}
                </p>
              </div>

              <div>
                <b>Check-Out:</b>
                <p>
                  {format(parseISO(checkOutDate), "dd MMM yyyy")}{" "}
                  {checkOutTime}
                </p>
              </div>
            </div>

            <label className="phone-label">Mobile No.</label>
            <input
              type="tel"
              className="phone-input"
              placeholder="Mobile No."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button className="confirm-btn" onClick={handlePhoneSubmit}>
              Continue
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
