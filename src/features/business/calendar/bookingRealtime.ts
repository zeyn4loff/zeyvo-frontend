import Echo from "laravel-echo";
import Pusher, { type AuthorizerCallback } from "pusher-js";
import { authorizeBroadcastChannel } from "../api/client";

export const BOOKING_CHANGED_EVENT = "zeyvo-booking-realtime";

export interface BookingChangedDetail {
  businessId: string;
  bookingId: string;
  action: string;
  notificationId?: string | null;
}

interface RealtimeConfig {
  enabled: boolean;
  key: string;
  host: string;
  port: number;
  scheme: string;
}

export async function subscribeToBookings(businessId: string, onEvent: (event: BookingChangedDetail) => void): Promise<() => void> {
  const response = await fetch("/api/v1/realtime/config", { credentials: "include", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Realtime bağlantısı qurulmadı.");
  const payload = await response.json() as { data?: { realtime?: RealtimeConfig } };
  const config = payload.data?.realtime;
  if (!config?.enabled) return () => {};

  const echo = new Echo({
    broadcaster: "reverb",
    key: config.key,
    wsHost: config.host,
    wsPort: Number(config.port),
    wssPort: Number(config.port),
    forceTLS: config.scheme === "https",
    enabledTransports: ["ws", "wss"],
    client: Pusher,
    authorizer: (channel: { name: string }) => ({
      authorize: async (socketId: string, callback: AuthorizerCallback) => {
        try {
          callback(null, await authorizeBroadcastChannel(socketId, channel.name));
        } catch (error) { callback(error instanceof Error ? error : new Error("Kanal icazəsi alınmadı."), null); }
      },
    }),
  });
  const channel = `business.${businessId}.bookings`;
  echo.private(channel).listen(".booking.changed", (event: BookingChangedDetail) => onEvent(event));
  return () => { echo.leave(channel); echo.disconnect(); };
}
