import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "alanis",
    short_name: "alanis",
    description: "A Quran system. Scan the QR code to access Quranic features.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    protocol_handlers: [{ protocol: "web+menu", url: "/s%" }],
    display_override: ["standalone", "window-controls-overlay"],

    icons: [
      {
        src: "/al-anis.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/al-anis.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
