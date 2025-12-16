import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import SlotSelectionPage from "./pages/SlotSelectionPage";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import HotelListPage from "./pages/HotelListPage";
import BookingPreviewPage from "./pages/BookingPreviewPage"
import AdminPanel from "./pages/AdminPanel";
export default function AppRouter() {
  return (
    <Routes>
      {/* User Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/booking/slot" element={<SlotSelectionPage />} />
      <Route path="/booking/hotels" element={<HotelListPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/preview" element={<BookingPreviewPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/success" element={<SuccessPage />} />

      {/* Admin Pages */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin/panel"
        element={
          <ProtectedRoute>
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
