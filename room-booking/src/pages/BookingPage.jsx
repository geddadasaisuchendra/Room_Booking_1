import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BookingForm from "../components/booking/BookingForm";

export default function BookingPage() {
  const [slotData, setSlotData] = useState(null);

  useEffect(() => {
    const slot = localStorage.getItem("checkInSlot");
    const date = localStorage.getItem("selectedDate");

    if (slot && date) {
      setSlotData({
        date,
        slot
      });
    }
  }, []);

  if (!slotData) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>No Slot Selected</h2>
        <p>Please select a date and time slot before filling booking details.</p>

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

  return <BookingForm selectedSlot={slotData} />;
}
