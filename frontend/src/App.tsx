import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReservationDetail from "./pages/ReservationDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reservations/:id" element={<ReservationDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
