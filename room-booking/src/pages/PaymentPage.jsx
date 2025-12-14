import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openRazorpayPayment } from "../services/razorpay";

// Firebase
import { db } from "../services/firebase";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

export default function PaymentPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const form = JSON.parse(localStorage.getItem("bookingForm"));
    const phone = localStorage.getItem("userPhone");
    const hotelName = localStorage.getItem("selectedHotelName");
    const hotelType = localStorage.getItem("selectedHotelType");
    const amount = localStorage.getItem("selectedHotelPrice");

    const selectedDate = localStorage.getItem("selectedDate");
    const selectedSlot = localStorage.getItem("checkInSlot");
    const checkOutDate = localStorage.getItem("checkOutDate");
    const checkOutTime = localStorage.getItem("checkOutTime");

    const tempBookingId = localStorage.getItem("tempBookingId");

    if (!form || !hotelName || !phone || !selectedSlot) {
      alert("Missing booking details. Restart booking.");
      navigate("/booking");
      return;
    }

    const bookingData = {
      ...form,
      phone,
      hotelName,
      hotelType,
      amount: Number(amount),
      date: selectedDate,
      selectedSlot,
      checkOutDate,
      checkOutTime,
      status: "pending",
      createdAt: new Date()
    };

    openRazorpayPayment({
      amount,
      name: form.name,
      phone,
      date: selectedDate,
      timeSlot: selectedSlot,

      /* -------------------------
         PAYMENT SUCCESS
      -------------------------- */
      onSuccess: async (res) => {
        const paymentId = res.razorpay_payment_id;

        // 1️⃣ Confirm Slot
        await setDoc(
          doc(db, "bookings", selectedDate, "slots", selectedSlot),
          {
            status: "confirmed",
            phone,
            expiry: null
          },
          { merge: true }
        );

        // 2️⃣ Save final booking WITHOUT date prefix
        await setDoc(
          doc(db, "userBookings", paymentId),
          {
            ...bookingData,
            paymentId,
            status: "success",
            createdAt: new Date()
          }
        );

        // 3️⃣ Remove temp pending booking doc (if created)
        if (tempBookingId) {
          await deleteDoc(doc(db, "userBookings", tempBookingId));
        }

        localStorage.setItem("lastPaymentId", paymentId);
        navigate("/success");
      },

      /* -------------------------
         PAYMENT FAILED
      -------------------------- */
      onFailure: async () => {
        // Release slot back to available
        await setDoc(
          doc(db, "bookings", selectedDate, "slots", selectedSlot),
          {
            status: "available",
            phone: null,
            expiry: null
          },
          { merge: true }
        );

        // Clean temp booking doc
        if (tempBookingId) {
          await deleteDoc(doc(db, "userBookings", tempBookingId));
        }

        alert("Payment failed. Please try again.");
        navigate("/booking");
      }
    });
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h3>Redirecting to payment...</h3>
    </div>
  );
}
