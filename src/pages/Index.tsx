import { useState, useEffect } from "react";
import LoginScreen from "@/components/LoginScreen";
import HomePage from "@/components/HomePage";
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

  return <HomePage user={user} onLogout={handleLogout} />;
};

export default Index;
