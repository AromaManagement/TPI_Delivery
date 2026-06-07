import React from "react";
import { router } from "expo-router";
import { LoginView } from "../views/login.view";

export default function LoginScreen() {
  const handleLoginSuccess = () => {
    // Navigate to the tabs layout upon successful login
    router.replace("/(tabs)");
  };

  return <LoginView onLoginSuccess={handleLoginSuccess} />;
}
