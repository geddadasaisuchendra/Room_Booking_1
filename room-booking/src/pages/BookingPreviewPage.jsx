import React, { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./preview.css";
import { format, parseISO } from "date-fns";

export default function BookingPreviewPage() {
  const form = JSON.parse(localStorage.getItem("bookingForm"));
  const phone = localStorage.getItem("userPhone");
  const hotelName = localStorage.getItem("selectedHotelName");
  const hotelType = localStorage.getItem("selectedHotelType");
  const amount = localStorage.getItem("selectedHotelPrice");

  const selectedDate = localStorage.getItem("selectedDate");
  const checkInSlot = localStorage.getItem("checkInSlot");
  const checkOutDate = localStorage.getItem("checkOutDate");
  const checkOutTime = localStorage.getItem("checkOutTime");

  useEffect(() => {
    if (!form || !hotelName) {
      window.location.href = "/booking"; // return to form if missing
    }
  }, []);

  const handleConfirm = () => {
    window.location.href = "/payment";
  };

  return (
    <>
      <Header />

      <div className="preview-container">

        <h2 className="preview-title">Review Your Booking</h2>
        <hr />

        {/* HOTEL DETAILS */}
        <div className="preview-section">
          <h3>Room Details</h3>
          <p><b>Hotel:</b> {hotelName}</p>
          <p><b>Room Type:</b> {hotelType}</p>
          <p><b>Total Price:</b> ₹{amount}</p>
        </div>

        <hr />

        {/* STAY DETAILS */}
        <div className="preview-section">
          <h3>Stay Details</h3>
          <p><b>Check-in:</b> {format(parseISO(selectedDate), "dd MMM yyyy")} at {checkInSlot}</p>
          <p><b>Check-out:</b> {format(parseISO(checkOutDate), "dd MMM yyyy")} at {checkOutTime}</p>
        </div>

        <hr />

        {/* PERSONAL DETAILS */}
        <div className="preview-section">
          <h3>Guest Information</h3>
          <p><b>Name:</b> {form.name}</p>
          <p><b>Email:</b> {form.email}</p>
          <p><b>Mobile:</b> {phone}</p>
          <p><b>City:</b> {form.city}</p>
          <p><b>State:</b> {form.state}</p>
          <p><b>Pincode:</b> {form.pincode}</p>
          <p><b>Address:</b> {form.address}</p>

          {form.pan && <p><b>PAN:</b> {form.pan}</p>}
          {form.idProof && <p><b>Address Proof:</b> {form.idProof}</p>}
          <p><b>ID No:</b> {form.idNumber}</p>
        </div>

        {/* BUTTONS */}
        <div className="preview-buttons">
          <button className="edit-btn" onClick={() => window.history.back()}>
            Edit Details
          </button>

          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm
          </button>
        </div>

      </div>

      <Footer />
    </>
  );
}
