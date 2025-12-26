import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { openRazorpayPayment } from "../services/razorpay";
import emailjs from "emailjs-com";
// Firebase
import { db } from "../services/firebase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp
} from "firebase/firestore";

export default function PaymentPage() {
  const navigate = useNavigate();

  useEffect(() => {
    async function startPayment() {
      /* =============================
         READ LOCAL STORAGE
      ============================== */
      const form = JSON.parse(localStorage.getItem("bookingForm"));
      const phone = localStorage.getItem("userPhone");
      const hotelName = localStorage.getItem("selectedHotelName");
      const hotelType = localStorage.getItem("selectedHotelType");
      const amount = localStorage.getItem("selectedHotelPrice");
      const roomId = localStorage.getItem("selectedRoomId");

      const selectedDate = localStorage.getItem("selectedDate");
      const selectedSlot = localStorage.getItem("checkInSlot");
      const checkOutDate = localStorage.getItem("checkOutDate");
      const checkOutTime = localStorage.getItem("checkOutTime");

      const tempBookingId = localStorage.getItem("tempBookingId");

      if (
        !form ||
        !phone ||
        !selectedDate ||
        !selectedSlot ||
        !tempBookingId ||
        !roomId
      ) {
        alert("Missing booking details. Please restart booking.");
        navigate("/");
        return;
      }

      const tempRef = doc(db, "userBookings", tempBookingId);

      /* =====================================================
         1️⃣ ADMIN DATE BLOCK CHECK (HARD STOP)
      ===================================================== */
      const dateSnap = await getDoc(doc(db, "bookings", selectedDate));

      if (dateSnap.exists() && dateSnap.data().dateStatus === "blocked") {
        alert("This date has been blocked by admin.");
        await deleteDoc(tempRef);
        navigate("/");
        return;
      }

      /* =====================================================
         2️⃣ VERIFY TEMP BOOKING STILL VALID
      ===================================================== */
      const tempSnap = await getDoc(tempRef);

      if (!tempSnap.exists()) {
        alert("Booking expired. Please try again.");
        navigate("/");
        return;
      }

      if (tempSnap.data().status !== "pending") {
        alert("Booking no longer valid.");
        navigate("/");
        return;
      }

      /* =====================================================
         3️⃣ ADMIN ROOM BLOCK CHECK (FINAL AUTHORITY)
      ===================================================== */
      const adminRoomSnap = await getDoc(
        doc(
          db,
          "bookings",
          selectedDate,
          "slots",
          selectedSlot,
          "rooms",
          roomId
        )
      );

      if (
        adminRoomSnap.exists() &&
        adminRoomSnap.data().blockedBy === "admin"
      ) {
        alert("This room has been blocked by admin.");
        await deleteDoc(tempRef);
        navigate("/");
        return;
      }

      /* =====================================================
         4️⃣ ROOM ALREADY BOOKED CHECK (SUCCESS / VALID PENDING)
      ===================================================== */
      const bookingsSnap = await getDocs(collection(db, "userBookings"));
      const now = new Date();

      for (const bSnap of bookingsSnap.docs) {
        if (bSnap.id === tempBookingId) continue;
        
        const b = bSnap.data();

        if (
          b.roomId === roomId &&
          b.date === selectedDate &&
          b.selectedSlot === selectedSlot &&
          (
            b.status === "success" ||
            (
              b.status === "pending" &&
              b.expiry &&
              b.expiry.toDate() > now
            )
          )
        ) {
          alert("Room is no longer available.");
          await deleteDoc(tempRef);
          navigate("/");
          return;
        }
      }

      /* =====================================================
         5️⃣ FINAL BOOKING PAYLOAD
      ===================================================== */
      const bookingData = {
        ...form,
        phone,
        hotelName,
        hotelType,
        roomId,
        amount: Number(amount),

        date: selectedDate,
        selectedSlot,
        checkOutDate,
        checkOutTime,

        status: "pending",
        createdAt: new Date()
      };

      /* =====================================================
         6️⃣ OPEN RAZORPAY
      ===================================================== */
      openRazorpayPayment({
        amount,
        name: form.name,
        phone,

        /* -------- PAYMENT SUCCESS -------- */
        onSuccess: async (res) => {
          const paymentId = res.razorpay_payment_id;

          await setDoc(doc(db, "userBookings", paymentId), {
            ...bookingData,
            paymentId,
            transactionId: paymentId,
            status: "success",
            updatedAt: serverTimestamp()
          });

          await deleteDoc(tempRef);

           // 🔔 SEND USER EMAIL
            emailjs.send(
              import.meta.env.VITE_Email_Service_ID,
              import.meta.env.VITE_Email_User_template_ID, // USER TEMPLATE
              {
                user_name: form.name,
                user_email: form.email,
                phone,
                room_type: hotelType,
                room_id: roomId,
                checkin_date: selectedDate,
                checkin_slot: selectedSlot,
                checkout_date: checkOutDate,
                checkout_time: checkOutTime,
                amount,
                payment_id: paymentId
              },
              import.meta.env.VITE_Email_APIkey
            );

            // 🔔 SEND ADMIN EMAIL
            emailjs.send(
              import.meta.env.VITE_Email_Service_ID,
              import.meta.env.VITE_Email_Admin_template_ID, // ADMIN TEMPLATE
              {
                user_name: form.name,
                user_email: form.email,
                phone,
                room_type: hotelType,
                room_id: roomId,
                checkin_date: selectedDate,
                checkin_slot: selectedSlot,
                amount,
                payment_id: paymentId
              },
              import.meta.env.VITE_Email_APIkey
            );


          localStorage.removeItem("tempBookingId");
          localStorage.setItem("lastPaymentId", paymentId);

          navigate("/success");
        },

        /* -------- PAYMENT FAILED -------- */
        onFailure: async () => {
          await deleteDoc(tempRef);
          alert("Payment failed. Please try again.");
          navigate("/");
        },

        /* -------- USER CLOSED PAYMENT -------- */
        modal: {
          ondismiss: async () => {
            await deleteDoc(tempRef);
            alert("Payment cancelled.");
            navigate("/");
          }
        }
      });
    }

    startPayment();
  }, [navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h3>Redirecting to payment…</h3>
    </div>
  );
}
