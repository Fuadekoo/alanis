import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al Anis Quran Center",
    short_name: "Al Anis",
    description:
      "A comprehensive educational management system for managing students, teachers, attendance, payments, and reports.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    display_override: ["standalone", "window-controls-overlay"],
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/al-anis.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/al-anis.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
    categories: ["education", "productivity"],
    lang: "am",
    dir: "ltr",
  };
}
