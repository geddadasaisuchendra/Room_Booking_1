import BookingTable from "../components/admin/BookingTable";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";

export default function AdminDashboardPage() {
  const logout = () => {
    signOut(auth);
    window.location.href = "/admin/login";
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Admin Dashboard</h2>
        <button className="btn btn-danger" onClick={logout}>
          Logout
        </button>
      </div>

      <BookingTable />
    </div>
  );
}
