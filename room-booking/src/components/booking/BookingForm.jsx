import React, { useState, useEffect } from "react";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import "./Booking.css";
import { format } from "date-fns";

/* =========================
   VALIDATION HELPERS
========================= */
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPincode = (pin) =>
  /^[1-9][0-9]{5}$/.test(pin);

const isValidPAN = (pan) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);

export default function BookingPage() {
  const phone = localStorage.getItem("userPhone");
  const hotelName = localStorage.getItem("selectedHotelName");
  const hotelType = localStorage.getItem("selectedHotelType");

  const selectedDate = localStorage.getItem("selectedDate");
  const checkInSlot = localStorage.getItem("checkInSlot");

  // Redirect if missing critical data
  useEffect(() => {
    if (!hotelName || !selectedDate || !checkInSlot) {
      window.location.href = "/";
    }
  }, []);

  /* =========================
     FORM STATE
  ========================= */
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

  const [errors, setErrors] = useState({});

  /* =========================
     HANDLE CHANGE
  ========================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "pan" ? value.toUpperCase() :
        name === "pincode" ? value.replace(/\D/g, "") :
        value,
    });

    setErrors({ ...errors, [name]: "" });
  };

  /* =========================
     VALIDATION LOGIC
  ========================= */
  const validateForm = () => {
    const newErrors = {};

    if (!form.name || form.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!form.email || !isValidEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!form.state) {
      newErrors.state = "State is required";
    }

    if (!form.pincode || !isValidPincode(form.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit pincode";
    }

    if (form.pan && !isValidPAN(form.pan)) {
      newErrors.pan = "Invalid PAN format (ABCDE1234F)";
    }
    if (!form.idProof) {
       newErrors.idProof = "Please select an address proof";
   }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
   
  /* =========================
     SUBMIT
  ========================= */
  const handleSubmit = () => {
    if (!validateForm()) return;

    localStorage.setItem(
      "bookingForm",
      JSON.stringify({
        ...form,
        pan: form.pan ? form.pan.toUpperCase() : "",
      })
    );

    window.location.href = "/booking/preview";
  };

  return (
    <>
      <Header />

      <div className="booking-container">
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

        {/* =========================
           FORM
        ========================= */}
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={handleChange} />
            {errors.name && <small className="error">{errors.name}</small>}
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input name="email" value={form.email} onChange={handleChange} />
            {errors.email && <small className="error">{errors.email}</small>}
          </div>

          <div className="form-group">
            <label>PAN Number</label>
            <input
              name="pan"
              maxLength={10}
              value={form.pan}
              onChange={handleChange}
            />
            {errors.pan && <small className="error">{errors.pan}</small>}
          </div>

          <div className="form-group">
            <label>City</label>
            <input name="city" value={form.city} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>State *</label>
            <input name="state" value={form.state} onChange={handleChange} />
            {errors.state && <small className="error">{errors.state}</small>}
          </div>

          <div className="form-group">
            <label>Pincode *</label>
            <input
              name="pincode"
              maxLength={6}
              value={form.pincode}
              onChange={handleChange}
            />
            {errors.pincode && <small className="error">{errors.pincode}</small>}
          </div>

          <div className="form-group address-wide">
            <label>Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
              <label>Address Proof</label>
              <select
                name="idProof"
                value={form.idProof}
                onChange={handleChange}
              >
                <option value="">Select Address Proof</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Passport">Passport</option>
              </select>
              {errors.idProof && <small className="error">{errors.idProof}</small>}
        </div>

        </div>

        {/* =========================
           BUTTONS
        ========================= */}
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
