import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openRazorpayPayment } from "../services/razorpay";

// Firebase
import { db } from "../services/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

export default function PaymentPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function startPayment() {
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

      if (!form || !hotelName || !phone || !selectedDate || !selectedSlot) {
        alert("Missing booking details. Please restart booking.");
        navigate("/");
        return;
      }

      /* =====================================================
         1️⃣ DATE LEVEL CHECK (ADMIN BLOCK SAFE)
      ===================================================== */
      const dateRef = doc(db, "bookings", selectedDate);
      const dateSnap = await getDoc(dateRef);

      if (dateSnap.exists() && dateSnap.data().dateStatus === "blocked") {
        alert("This date has been blocked by admin. Please select another date.");
        navigate("/");
        return;
      }

      /* =====================================================
         2️⃣ SLOT LEVEL CHECK
      ===================================================== */
      const slotRef = doc(db, "bookings", selectedDate, "slots", selectedSlot);
      const slotSnap = await getDoc(slotRef);

      if (!slotSnap.exists()) {
        alert("Slot not available. Please select another slot.");
        navigate("/booking/slot");
        return;
      }

      const slotData = slotSnap.data();

      if (slotData.status === "confirmed") {
        alert("This slot has been blocked. Please select another slot.");
        navigate("/booking/slot");
        return;
      }

      /* =====================================================
         3️⃣ PREPARE BOOKING DATA
      ===================================================== */
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

      /* =====================================================
         4️⃣ OPEN RAZORPAY
      ===================================================== */
      openRazorpayPayment({
        amount,
        name: form.name,
        phone,
        date: selectedDate,
        timeSlot: selectedSlot,

        /* =========================
           PAYMENT SUCCESS
        ========================== */
        onSuccess: async (res) => {
          const paymentId = res.razorpay_payment_id;

          // ✅ CONFIRM SLOT (LOCK FOREVER)
          await setDoc(
            slotRef,
            {
              status: "confirmed",
              phone,
              expiry: null,
              transactionId: paymentId, // 🔐 Admin cannot override
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          // ✅ SAVE FINAL BOOKING
          await setDoc(doc(db, "userBookings", paymentId), {
            ...bookingData,
            paymentId,
            status: "success",
            createdAt: new Date()
          });

          // ✅ REMOVE TEMP BOOKING (IF ANY)
          if (tempBookingId) {
            await deleteDoc(doc(db, "userBookings", tempBookingId));
          }

          localStorage.setItem("lastPaymentId", paymentId);
          navigate("/success");
        },

        /* =========================
           PAYMENT FAILED
        ========================== */
        onFailure: async () => {
          const latestSnap = await getDoc(slotRef);

          // Release only if not confirmed
          if (latestSnap.exists() && latestSnap.data().status !== "confirmed") {
            await setDoc(
              slotRef,
              {
                status: "available",
                phone: null,
                expiry: null,
                transactionId: null
              },
              { merge: true }
            );
          }

          if (tempBookingId) {
            await deleteDoc(doc(db, "userBookings", tempBookingId));
          }

          alert("Payment failed. Please try again.");
          navigate("/");
        },

        /* =========================
           USER CLOSED PAYMENT
        ========================== */
        modal: {
          ondismiss: async () => {
            const latestSnap = await getDoc(slotRef);

            if (latestSnap.exists() && latestSnap.data().status !== "confirmed") {
              await setDoc(
                slotRef,
                {
                  status: "available",
                  phone: null,
                  expiry: null,
                  transactionId: null
                },
                { merge: true }
              );
            }

            alert("Payment cancelled.");
            navigate("/");
          }
        }
      });
    }

    startPayment();
  }, []);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h3>Redirecting to payment…</h3>
    </div>
  );
}
