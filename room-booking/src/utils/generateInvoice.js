import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateInvoice(booking) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Room Booking Invoice", 14, 20);

  doc.setFontSize(11);
  doc.text(`Invoice ID: ${booking.paymentId}`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleString()}`, 14, 38);

  autoTable(doc, {
    startY: 45,
    head: [["Field", "Details"]],
    body: [
      ["Name", booking.name],
      ["Phone", booking.phone],
      ["Hotel", `${booking.hotelName} (${booking.hotelType})`],
      ["Check-In", `${booking.selectedDate} ${booking.checkInSlot}`],
      ["Check-Out", `${booking.checkOutDate} ${booking.checkOutTime}`],
      ["Amount Paid", `${booking.price}`],
      ["Payment Status", "Success"]
    ]
  });

  doc.text(
    "Thank you for your booking.",
    14,
    doc.lastAutoTable.finalY + 15
  );

  doc.save(`Invoice_${booking.paymentId}.pdf`);
}
