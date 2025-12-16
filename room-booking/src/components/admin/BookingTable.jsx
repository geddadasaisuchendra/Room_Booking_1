import { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import { collection, getDocs, query, orderBy,deleteDoc, doc } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function BookingTable() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const q = query(
          collection(db, "userBookings"),
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBookings(data);
      } catch (error) {
        console.log("Error loading bookings:", error);
      }
    };

    loadBookings();
  }, []);

  // EXPORT TO EXCEL FUNCTION
  const exportToExcel = () => {
    if (!bookings || bookings.length === 0) {
      alert("No data to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(bookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    XLSX.writeFile(workbook, "Bookings.xlsx");
  };


  //Delete handler
  const handleDelete = async (id) => {
  const confirm = window.confirm(
    "Are you sure you want to delete this booking?"
  );

  if (!confirm) return;

  try {
    await deleteDoc(doc(db, "userBookings", id));
    setBookings((prev) => prev.filter((b) => b.id !== id));
    alert("Booking deleted successfully.");
  } catch (err) {
    console.error(err);
    alert("Failed to delete booking.");
  }
};

  return (
    <>
      <button
        onClick={exportToExcel}
        className="btn btn-primary"
        style={{ marginBottom: 15 }}
      >
        Export to Excel
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
          background: "white",
        }}
      >
        <thead>
          <tr style={{ background: "#f3f3f3", fontWeight: "bold" }}>
            <th style={cell}>Name</th>
            <th style={cell}>Phone</th>
            <th style={cell}>Hotel</th>
            <th style={cell}>Check-In</th>
            <th style={cell}>Check-Out</th>
            <th style={cell}>Amount</th>
            <th style={cell}>Payment ID</th>
            <th style={cell}>Status</th>
            <th style={cell}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {bookings.map((b) => {
            const statusStyle = {
              ...cell,
              color: b.status === "success" ? "green" : "red",
              fontWeight: 700,
            };

            return (
              <tr key={b.id}>
                <td style={cell}>{b.name}</td>
                <td style={cell}>{b.phone}</td>

                <td style={cell}>
                  {b.hotelName}
                  <br />
                  <small>({b.hotelType})</small>
                </td>

                <td style={cell}>
                  {b.date} <br/> {b.selectedSlot}
                  <br />
                  <small>{b.checkInSlot}</small>
                </td>

                <td style={cell}>
                  {b.checkOutDate}
                  <br />
                  <small>{b.checkOutTime}</small>
                </td>

                <td style={cell}>₹{b.amount}</td>

                <td style={cell}>
                  <b>{b.paymentId}</b>
                </td>

                <td style={statusStyle}>{b.status}</td>
                <td style={cell}>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(b.id)}
                      >
                        Delete
                      </button>
                    </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

const cell = {
  border: "1px solid #ddd",
  padding: "10px",
  textAlign: "center",
};
