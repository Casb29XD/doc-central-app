import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import LoginScreen from "@/components/LoginScreen";
import AppLayout from "@/components/AppLayout";
import SearchPage from "@/pages/SearchPage";
import FavoritesPage from "@/pages/FavoritesPage";
import HistoryPage from "@/pages/HistoryPage";
import SimilarityPage from "@/pages/SimilarityPage";
import { getUser, setUser, logoutUser } from "@/lib/store";

const Index = () => {
  const [user, setUserState] = useState<string | null>(null);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  const handleLogin = (identifier: string) => {
    setUser(identifier);
    setUserState(identifier);
  };

  const handleLogout = () => {
    logoutUser();
    setUserState(null);
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AppLayout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/similarity" element={<SimilarityPage />} />
        <Route path="*" element={<Navigate to="/search" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default Index;
