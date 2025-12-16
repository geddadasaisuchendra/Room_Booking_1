import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HotelCard from "../components/hotel/HotelCard";
import "./hotel.css";
import room1 from "../../src/assets/img1.jpeg";
import room2 from "../../src/assets/img2.jpeg"
import { format, parseISO } from "date-fns";
import { db } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function HotelListPage() {
  const selectedDate = localStorage.getItem("selectedDate");
  const checkInSlot = localStorage.getItem("checkInSlot");
  const checkOutDate = localStorage.getItem("checkOutDate");
  const checkOutTime = localStorage.getItem("checkOutTime");

  const [showModal, setShowModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [phone, setPhone] = useState("");

  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!selectedDate || !checkInSlot) {
      window.location.href = "/";
    }
  }, []);
   
  //Load Rooms
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

  // OPEN MODAL WITH HOTEL DATA
  const handleBookClick = (hotel) => {
    setSelectedHotel(hotel);
    setShowModal(true);
  };

  // HANDLE PHONE SUBMIT
  const handlePhoneSubmit = async() => {
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }
  // 🔑 UPDATE SLOT WITH PHONE NUMBER
  await setDoc(
    doc(db, "bookings", selectedDate, "slots", checkInSlot),
    {
      phone: phone
    },
    { merge: true }
  );
  
    // Save data for next page
    localStorage.setItem("userPhone", phone);
    localStorage.setItem("selectedHotelName", selectedHotel.name);
    localStorage.setItem("selectedHotelType", selectedHotel.type);
    localStorage.setItem("selectedHotelPrice", selectedHotel.price);

    window.location.href = "/booking";
  };

  return (
    <>
      <Header />

      <div className="hotel-container">
        {/* TITLE */}
        <h2 className="slot-title">Check In Slot Availability</h2>

        <h3 className="slot-date">
          {format(parseISO(selectedDate), "dd MMM yyyy")} – {checkInSlot}
        </h3>

        <p className="checkout-text">
          Checkout By {format(parseISO(checkOutDate), "dd MMM yyyy")}{" "}
          {checkOutTime}
        </p>


<div className="hotel-layout">

  {/* LEFT IMAGE */}
  <div className="hotel-image">
    <img src={room1} alt="Hotel Room" />
  </div>

  {/* RIGHT ROOM CARDS */}
  <div className="room-list">
    <h3>BHEEMA GRAND RESIDENCY</h3>

    {!rooms || rooms.length === 0 && (
      <p>No room types available</p>
    )}

    {rooms && rooms.map((room, index) => (
      <div key={index} className="room-card-horizontal">

        {/* LEFT */}
        <div className="room-left">
          <div className="room-persons">
            {room.persons} Persons
          </div>
          <div className="room-type">
            {room.type}
          </div>
        </div>

        {/* RIGHT */}
        <div className="room-right">
          <div className="room-price">
            ₹{room.price}/-
          </div>

          <button
            className="book-now-btn"
            onClick={() =>
              handleBookClick({
                name: "BHEEMA GRAND RESIDENCY",
                type: room.type,
                persons: room.persons,
                price: room.price
              })
            }
          >
            Book Now
          </button>
        </div>

      </div>
    ))}
  </div>

</div>

        
      </div>

      {/* PHONE NUMBER MODAL */}
      {showModal && selectedHotel && (
        <div className="modal-overlay">
          <div className="booking-modal">

            <button className="close-btn" onClick={() => setShowModal(false)}>
              ×
            </button>

            {/* HOTEL NAME */}
            <h3 className="hotel-titleModal">{selectedHotel.name}</h3>
            <p className="hotel-typeModal">{selectedHotel.type}</p>

            {/* CHECK-IN & OUT */}
            <div className="modal-info">
              <div>
                <b>Check-In:</b>
                <p>
                  {format(parseISO(selectedDate), "dd MMM yyyy")} – {checkInSlot}
                </p>
              </div>

              <div>
                <b>Check-Out:</b>
                <p>
                  {format(parseISO(checkOutDate), "dd MMM yyyy")} {checkOutTime}
                </p>
              </div>
            </div>

            {/* MOBILE NUMBER */}
            <label className="phone-label">Mobile No.</label>
            <input
              type="tel"
              className="phone-input"
              placeholder="Mobile No."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {/* BOOK BUTTON */}
            <button className="confirm-btn" onClick={handlePhoneSubmit}>
              Book
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
