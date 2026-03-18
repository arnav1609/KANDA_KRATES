import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function AdminLayout() {
  const { isAuthenticated, isLoading, userRole } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F7FAF9" }}>
        <ActivityIndicator size="large" color="#1E6F5C" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Block farmer users from admin routes
  if (userRole !== "admin") {
    return <Redirect href="/farmer/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}