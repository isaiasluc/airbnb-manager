import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "@/presentation/shared/PrivateRoute";
import Dashboard from "@/presentation/pages/Dashboard";
import Login from "@/presentation/pages/Login";
import ReservationDetail from "@/presentation/pages/ReservationDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/reservations/:id"
          element={
            <PrivateRoute>
              <ReservationDetail />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
