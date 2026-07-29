import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "./adminApi";

export function ProtectedAdminRoute({ children }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
