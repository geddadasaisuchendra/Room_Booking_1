import React, { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "./Booking.css";
import { format } from "date-fns";

export default function BookingPage() {
  const phone = localStorage.getItem("userPhone");
  const hotelName = localStorage.getItem("selectedHotelName");
  const hotelType = localStorage.getItem("selectedHotelType");
  const amount = localStorage.getItem("selectedHotelPrice");

  const selectedDate = localStorage.getItem("selectedDate");
  const checkInSlot = localStorage.getItem("checkInSlot");
  const checkOutDate = localStorage.getItem("checkOutDate");
  const checkOutTime = localStorage.getItem("checkOutTime");

  // Redirect if missing data
  useEffect(() => {
    if (!hotelName || !selectedDate) {
      window.location.href = "/";
    }
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    pan: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    idProof: "",
    idNumber: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.state || !form.pincode) {
      alert("Please fill all required (*) fields");
      return;
    }

    localStorage.setItem("bookingForm", JSON.stringify(form));
    window.location.href = "/booking/preview";
  };

  return (
    <>
      <Header />

      <div className="booking-container">

        {/* Invoice Title */}
        <h2 className="invoice-title">{phone} - Room Invoice</h2>
        <hr />

        <div className="top-section">
          <div>
            <b>Booking Date:</b>
            <p>{format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
          </div>

          <div className="hotel-info-right">
            <b>{hotelName}</b>
            <p>{hotelType}</p>
          </div>
        </div>

        <hr />

        {/* FORM SECTION */}
        <div className="form-grid">

          <div className="form-group">
            <label>Name</label>
            <input name="name" value={form.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>*Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>PAN number</label>
            <input name="pan" value={form.pan} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>City</label>
            <input name="city" value={form.city} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>*State</label>
            <input name="state" value={form.state} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>*Pincode</label>
            <input name="pincode" value={form.pincode} onChange={handleChange} />
          </div>

          <div className="form-group address-wide">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Address Proof</label>
            <input name="idProof" value={form.idProof} onChange={handleChange} />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="form-buttons">
          <button className="cancel-btn" onClick={() => window.history.back()}>
            Cancel
          </button>

          <button className="save-btn" onClick={handleSubmit}>
            Save and Continue
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}
