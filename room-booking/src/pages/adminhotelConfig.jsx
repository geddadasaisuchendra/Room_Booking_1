import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../styles/adminhotel.css";

export default function AdminHotelConfig() {
  const [rooms, setRooms] = useState([]);

  /* ----------------------------------
     LOAD EXISTING CONFIG (OPTIONAL)
     If nothing exists, admin starts fresh
  ---------------------------------- */
  useEffect(() => {
    async function loadData() {
      try {
        const ref = doc(db, "hotelConfig", "main");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setRooms(snap.data().rooms || []);
        }
      } catch (err) {
        console.error("Hotel config load failed", err);
      }
    }

    loadData();
  }, []);

  /* ----------------------------------
     UPDATE ROOM FIELD
  ---------------------------------- */
  const updateRoom = (index, field, value) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  /* ----------------------------------
     ADD ROOM TYPE
  ---------------------------------- */
  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: crypto.randomUUID(),
        persons: "",
        type: "",
        price: ""
      }
    ]);
  };

  /* ----------------------------------
     DELETE ROOM
  ---------------------------------- */
  const deleteRoom = (index) => {
    if (!window.confirm("Delete this room type?")) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  /* ----------------------------------
     SAVE CONFIG TO FIRESTORE
     (Auto-creates document)
  ---------------------------------- */
  const saveChanges = async () => {
    // Basic validation
    for (const r of rooms) {
      if (!r.persons || !r.type || !r.price) {
        alert("Please fill all room fields before saving");
        return;
      }
    }

    await setDoc(
      doc(db, "hotelConfig", "main"),
      {
        rooms,
        updatedAt: new Date()
      },
      { merge: true }
    );

    alert("Hotel pricing updated successfully");
  };

  return (
    <div className="admin-hotel-container">
      <h2>Hotel Pricing & Capacity</h2>

      {rooms.length === 0 && (
        <p className="empty-text">
          No room types added yet. Click “Add Room Type”.
        </p>
      )}

      {rooms.map((room, index) => (
        <div className="room-card" key={room.id}>
          <div className="room-grid">
            <div>
              <label>Persons</label>
              <input
                type="number"
                min="1"
                value={room.persons}
                onChange={(e) =>
                  updateRoom(index, "persons", e.target.value)
                }
              />
            </div>

            <div>
              <label>Room Type</label>
              <input
                placeholder="AC / Non-AC"
                value={room.type}
                onChange={(e) =>
                  updateRoom(index, "type", e.target.value)
                }
              />
            </div>

            <div>
              <label>Price (₹)</label>
              <input
                type="number"
                min="0"
                value={room.price}
                onChange={(e) =>
                  updateRoom(index, "price", e.target.value)
                }
              />
            </div>
          </div>

          <button
            className="delete-btn"
            onClick={() => deleteRoom(index)}
          >
            Delete
          </button>
        </div>
      ))}

      <div className="admin-actions">
        <button className="add-btn" onClick={addRoom}>
          + Add Room Type
        </button>

        <button className="save-btn" onClick={saveChanges}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
