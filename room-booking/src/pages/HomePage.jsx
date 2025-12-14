import React from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Calendar from "../components/calendar/Calendar";
import "./home.css";

export default function HomePage() {

  const bookedDates = ["2025-12-15", "2025-12-16"]; // demo

  const handleDateSelect = (date) => {
    localStorage.setItem("selectedDate", date);
    window.location.href = "/booking/slot";
  };

  return (
    <>
      <Header />

      <div className="container mt-4">

        {/* Rules ABOVE calendar */}
        <div className="rules-wrapper">
          <h4 className="rules-title">Kind attention to customers visiting Bheema Grand Residency</h4>
          <div className="rules-box">
          <ul>
            <li>Booking can be done for one to two days.</li>
            <li>No cancellation, refund, or date/time change allowed.</li>
            <li>Each room can accommodate two to four adults.</li>
            <li>No extra bed or bedding will be provided.</li>
            <li>You may book rooms instently and also in advance.</li>
            <li>A successful payment does not guarantee a booking. Wait for the confirmation message shown on the screen. Return to this page after completing your UPI payment.</li>
            <li>A refundable deposit equal to one day's room tariff must be paid in cash at the time of check-in.</li>
            <li>Bheema Grand Residency reserves the right to cancel any booking at any time and refund the amount in full.</li>
            <li>Rooms can be booked in advance, only on this website - bheemagrandresidency.com or in person at  Bheema Grand Residency, Mantralayam</li>
            <li>you can book via Email/WA/Phone booking/enquiry.</li>
            <li>contact us at +91 9603527758</li>

          </ul>
           </div>
        </div>

        <h2 className="calendar-heading mb-3">Online Room Availability</h2>

        {/* CALENDAR */}
        <div className="calendar-container mb-4">
          <Calendar onDateSelect={handleDateSelect} bookedDates={bookedDates} />
        </div>

      </div>

      <Footer />
    </>
  );
}
