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
          <h4 className="rules-title">Kind attention to all devotees visiting Mantralayam</h4>
          <div className="rules-box">
          <ul>
            <li>Booking is for one day only</li>
            <li>No cancellation, refund, or date/time change allowed.</li>
            <li>You may book up to two rooms per login ID in a month.</li>
            <li>Rooms will not be allotted to a single person. Such bookings will be cancelled and money will not be refunded.</li>
            <li>Each room can accommodate two to four adults.</li>
            <li>No extra bed or bedding will be provided.</li>
            <li>You may book rooms between 3 and 15 days in advance.</li>
            <li>if bookings are in pending state please wait for 5mins</li>
            <li>A successful payment does not guarantee a booking. Wait for the confirmation message shown on the screen. Return to this page after completing your UPI payment.</li>
            <li>A refundable deposit equal to one day's room tariff must be paid in cash at the time of check-in.</li>
            <li>Bima Grand Residency reserves the right to cancel any booking at any time and refund the amount in full.</li>
            <li>Rooms can be booked in advance, only on this website - bimagrandresidency.com or in person at CRO in Mantralayam</li>
            <li>No Email/WA/Phone booking/enquiry. Please do not call for rooms.</li>

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
