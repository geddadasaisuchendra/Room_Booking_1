import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  serverTimestamp,
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
      const hotelPersons = localStorage.getItem("selectedHotelPersons");
      const amount = Number(localStorage.getItem("selectedHotelPrice"));
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
         1️⃣ ADMIN DATE BLOCK CHECK
      ===================================================== */
      const dateSnap = await getDoc(doc(db, "bookings", selectedDate));
      if (dateSnap.exists() && dateSnap.data().dateStatus === "blocked") {
        alert("This date has been blocked by admin.");
        await deleteDoc(tempRef);
        navigate("/");
        return;
      }

      /* =====================================================
         2️⃣ VERIFY TEMP BOOKING
      ===================================================== */
      const tempSnap = await getDoc(tempRef);
      if (!tempSnap.exists() || tempSnap.data().status !== "pending") {
        alert("Booking expired. Please try again.");
        navigate("/");
        return;
      }

      /* =====================================================
         3️⃣ DATE LEVEL ROOM LIMIT (MAX 4)
      ===================================================== */
      const bookingsSnap = await getDocs(collection(db, "userBookings"));
      let bookedRoomsForDate = 0;

      bookingsSnap.forEach((d) => {
        const b = d.data();
        if (b.date === selectedDate && b.status === "success") {
          bookedRoomsForDate += 1;
        }
      });

      if (bookedRoomsForDate > 4) {
        alert("No rooms available for this date.");
        await deleteDoc(tempRef);
        navigate("/");
        return;
      }

      /* =====================================================
         4️⃣ ADMIN ROOM BLOCK CHECK
      ===================================================== */
      const adminRoomSnap = await getDoc(
        doc(db, "bookings", selectedDate, "slots", selectedSlot, "rooms", roomId)
      );

      if (adminRoomSnap.exists() && adminRoomSnap.data().blockedBy === "admin") {
        alert("This room has been blocked by admin.");
        await deleteDoc(tempRef);
        navigate("/");
        return;
      }

      /* =====================================================
         5️⃣ ROOM DOUBLE BOOK CHECK
      ===================================================== */
      const now = new Date();

      for (const d of bookingsSnap.docs) {
        if (d.id === tempBookingId) continue;

        const b = d.data();
        if (
          b.roomId === roomId &&
          b.date === selectedDate &&
          b.selectedSlot === selectedSlot &&
          (b.status === "success" ||
            (b.status === "pending" &&
              b.expiry &&
              b.expiry.toDate() > now))
        ) {
          alert("Room is no longer available.");
          await deleteDoc(tempRef);
          navigate("/");
          return;
        }
      }

      /* =====================================================
         6️⃣ CREATE RAZORPAY ORDER (SERVER – VERCEL)
      ===================================================== */
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderRes.json();

      if (!orderData.id) {
        alert("Payment initialization failed.");
        navigate("/");
        return;
      }

      /* =====================================================
         7️⃣ OPEN RAZORPAY CHECKOUT
      ===================================================== */
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: "INR",
        name: "Bheema Grand Residency",
        description: "Room Booking",
        order_id: orderData.id,
        handler: async (response) => {
          const paymentId = response.razorpay_payment_id;

          const bookingData = {
            ...form,
            phone,
            hotelName,
            hotelType,
            hotelPersons,
            roomId,
            amount,
            date: selectedDate,
            selectedSlot,
            checkOutDate,
            checkOutTime,
            status: "success",
            paymentId,
            transactionId: paymentId,
            createdAt: new Date(),
          };

          await setDoc(doc(db, "userBookings", paymentId), {
            ...bookingData,
            updatedAt: serverTimestamp(),
          });

          await deleteDoc(tempRef);

          /* -------- EMAILS -------- */
          emailjs.send(
            "service_3tjizh3",
            "template_vlxd354",
            {
              user_name: form.name,
              user_email: form.email,
              phone,
              room_type: `${hotelType} - ${hotelPersons}`,
              room_id: roomId,
              checkin_date: selectedDate,
              checkin_slot: selectedSlot,
              checkout_date: checkOutDate,
              checkout_time: checkOutTime,
              amount,
              payment_id: paymentId,
            },
            "lUER1WdBTQbXUpHwh"
          );

          emailjs.send(
            "service_3tjizh3",
            "template_uu9q8bf",
            {
              user_name: form.name,
              user_email: form.email,
              phone,
              room_type: `${hotelType} - ${hotelPersons}`,
              room_id: roomId,
              checkin_date: selectedDate,
              checkin_slot: selectedSlot,
              amount,
              payment_id: paymentId,
            },
            "lUER1WdBTQbXUpHwh"
          );

          localStorage.removeItem("tempBookingId");
          localStorage.setItem("lastPaymentId", paymentId);

          navigate("/success");
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: phone,
        },
        theme: {
          color: "#0b8a3e",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    }

    startPayment();
  }, [navigate]);

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h3>Redirecting to payment…</h3>
    </div>
  );
}
