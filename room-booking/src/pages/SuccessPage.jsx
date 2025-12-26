import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { generateInvoice } from "../utils/generateInvoice";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function SuccessPage() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    // Success Page will read values again from localStorage
    const form = JSON.parse(localStorage.getItem("bookingForm"));
    const phone = localStorage.getItem("userPhone");
    const hotelName = localStorage.getItem("selectedHotelName");
    const hotelType = localStorage.getItem("selectedHotelType");
    const price = localStorage.getItem("selectedHotelPrice");

    const selectedDate = localStorage.getItem("selectedDate");
    const checkInSlot = localStorage.getItem("checkInSlot");
    const checkOutDate = localStorage.getItem("checkOutDate");
    const checkOutTime = localStorage.getItem("checkOutTime");

    const paymentId = localStorage.getItem("lastPaymentId");

    const bookingData = {
      ...form,
      phone,
      hotelName,
      hotelType,
      price,
      selectedDate,
      checkInSlot,
      checkOutDate,
      checkOutTime,
      paymentId,
    };

    setBooking(bookingData);
  }, []);

  return (
    <>
    <Header />
    <div className="container mt-5">
      <div
        className="card shadow-sm p-4 text-center"
        style={{ maxWidth: "550px", margin: "auto" }}
      >
        <h2 className="text-success mb-3">🎉 Booking Successful!</h2>

        <p className="text-muted">
          Your room booking has been confirmed.<br />
          Thank you for choosing our services!
        </p>

        {booking && (
          <div className="mt-4 text-start">
            <h5>Booking Summary</h5>
            <hr />

            <p><strong>Payment ID:</strong> {booking.paymentId}</p>
            <p><strong>Name:</strong> {booking.name}</p>
            <p><strong>Phone:</strong> {booking.phone}</p>

            <p>
              <strong>Hotel:</strong> {booking.hotelName} ({booking.hotelType})
            </p>

            <p>
              <strong>Check-In:</strong> {booking.selectedDate} – {booking.checkInSlot}
            </p>

            <p>
              <strong>Check-Out:</strong> {booking.checkOutDate} – {booking.checkOutTime}
            </p>

            <p><strong>Amount Paid:</strong> ₹{booking.price}</p>
          </div>
        )}
       <div className="mt-4 d-flex gap-2">
       <button
    className="btn btn-success w-100"
    onClick={() => generateInvoice(booking)}
  >
    Download Invoice
  </button>

  <Link to="/" className="btn btn-outline-primary w-100">
    Go to Home
  </Link>
</div>
      </div>
    </div>
     <Footer />
    </>
  );
}
