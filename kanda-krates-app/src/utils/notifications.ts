import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getSellMessage, Lang } from "./notificationMessages";

/* ===== NOTIFICATION HANDLER (FIXED TYPES) ===== */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

/* ===== REGISTER DEVICE ===== */
export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("alerts", {
      name: "AI Alerts",
      importance: Notifications.AndroidImportance.HIGH
    });
  }
}

/* ===== AI SELL ALERT ===== */
export async function triggerSellNotification(
  ohi: number,
  batch: string,
  lang: Lang
) {
  if (ohi > 70) return; // SAFE → no spam

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🧅 Kanda Krates Alert",
      body: getSellMessage(ohi, batch, lang),
      sound: true
    },
    trigger: null
  });
}
