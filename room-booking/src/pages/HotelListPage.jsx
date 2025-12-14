import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HotelCard from "../components/hotel/HotelCard";
import "./hotel.css";
import room1 from "../../src/assets/img1.jpeg";
import room2 from "../../src/assets/img2.jpeg"
import { format, parseISO } from "date-fns";

export default function HotelListPage() {
  const selectedDate = localStorage.getItem("selectedDate");
  const checkInSlot = localStorage.getItem("checkInSlot");
  const checkOutDate = localStorage.getItem("checkOutDate");
  const checkOutTime = localStorage.getItem("checkOutTime");

  const [showModal, setShowModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [phone, setPhone] = useState("");

  const [hotels] = useState([
    {
      id: 1,
      name: "BIMA GRAND RESIDENCY",
      image: room1,
      type: "AC",
      persons: 2,
      price: 2500,
    },
    {
      id: 2,
      name: "BIMA GRAND RESIDENCY",
      image: room2,
      type: "Non-AC",
      persons: 2,
      price: 1500,
    },
  ]);

  useEffect(() => {
    if (!selectedDate || !checkInSlot) {
      window.location.href = "/";
    }
  }, []);

  // OPEN MODAL WITH HOTEL DATA
  const handleBookClick = (hotel) => {
    setSelectedHotel(hotel);
    setShowModal(true);
  };

  // HANDLE PHONE SUBMIT
  const handlePhoneSubmit = () => {
    if (!phone || phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

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

        {/* HOTEL LIST */}
        {hotels.map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} onBook={handleBookClick} />
        ))}
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
