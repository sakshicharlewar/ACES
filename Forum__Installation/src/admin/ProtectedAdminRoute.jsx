import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAdminLoggedIn } from "./adminApi";

export function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate("/admin/login", { replace: true });
    };
    
    window.addEventListener("aces_admin_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("aces_admin_unauthorized", handleUnauthorized);
  }, [navigate]);

  if (!isAdminLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
