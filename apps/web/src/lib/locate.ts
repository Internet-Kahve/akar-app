import { Capacitor } from "@capacitor/core";

/** What the visitor reads when the device position cannot be had; the wording depends on what the position is for. */
export interface LocateMessages {
  unsupported: string;
  denied: string;
  timeout: string;
  failed: string;
}

/** One high-accuracy browser position, as `[lng, lat]` with the device's accuracy in metres. */
export async function locateOnce(
  messages: LocateMessages,
): Promise<{ coordinates: [number, number]; accuracyM: number }> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      return {
        coordinates: [position.coords.longitude, position.coords.latitude],
        accuracyM: position.coords.accuracy,
      };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      throw new Error(
        code === "OS-PLUG-GLOC-0003"
          ? messages.denied
          : code === "OS-PLUG-GLOC-0010"
            ? messages.timeout
            : messages.failed,
      );
    }
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(messages.unsupported));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          coordinates: [p.coords.longitude, p.coords.latitude],
          accuracyM: p.coords.accuracy,
        }),
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? messages.denied
              : error.code === 3
                ? messages.timeout
                : messages.failed,
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
