import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user,loading } = useContext(AuthContext);
  if (loading) return null; 
  if (!user) return <Navigate to="/admin/login" />;

  return children;
}
