import { db } from "../services/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

export async function lockSlot(date, slot, phone, lockMinutes = 5) {
  const slotRef = doc(db, "bookings", date, "slots", slot);

  const snap = await getDoc(slotRef);

  if (snap.exists()) {
    const data = snap.data();

    if (data.status === "confirmed") {
      return { success: false, message: "Slot already booked." };
    }

    if (data.status === "pending") {
      const expiry = data.expiry?.toDate() || null;

      if (expiry && expiry > new Date()) {
        return {
          success: false,
          message: "Someone else is booking this slot."
        };
      }
    }
  }

  const expiryTime = Timestamp.fromDate(
    new Date(Date.now() + lockMinutes * 60 * 1000)
  );

  await setDoc(
    slotRef,
    {
      status: "pending",
      phone,
      createdAt: serverTimestamp(),
      expiry: expiryTime
    },
    { merge: true }
  );

  return { success: true };
}
