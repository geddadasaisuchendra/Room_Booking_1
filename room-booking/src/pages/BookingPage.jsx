import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookingForm from "../components/booking/BookingForm";

export default function BookingPage() {
  const [slot, setSlot] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("selectedSlot");
    if (stored) {
      setSlot(JSON.parse(stored));
    }
  }, []);

  if (!slot) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>No Slot Selected</h2>
        <p>
          Please select a date and time slot before filling booking details.
        </p>
        <Link
          to="/booking/slot"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#007bff",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Go to Slot Selection
        </Link>
      </div>
    );
  }

  return (
       <div>
      <BookingForm selectedSlot={slot} />
    </div>
  );
}
