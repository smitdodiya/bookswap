import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Chats from "./pages/Chats";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import Requests from "./pages/Requests";

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">Loading…</div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/u/:id" element={<Protected><UserProfile /></Protected>} />
      <Route path="/chats" element={<Protected><Chats /></Protected>} />
      <Route path="/chats/:userId" element={<Protected><Chats /></Protected>} />
      <Route path="/communities" element={<Protected><Communities /></Protected>} />
      <Route path="/communities/:id" element={<Protected><CommunityDetail /></Protected>} />
      <Route path="/requests" element={<Protected><Requests /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
