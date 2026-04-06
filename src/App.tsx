import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import HateTrackPage from "./pages/HateTrackPage";
import MisinfoTrackPage from "./pages/MisinfoTrackPage";
import AccountsPage from "./pages/AccountsPage";
import NetworkPage from "./pages/NetworkPage";
import AboutPage from "./pages/AboutPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/hate" element={<HateTrackPage />} />
        <Route path="/misinfo" element={<MisinfoTrackPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
