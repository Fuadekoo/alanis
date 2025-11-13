import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Required fields
    name: "Al Anis Quran Center",
    short_name: "Al Anis",
    start_url: "/",
    icons: [
      {
        src: "/al-anis.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/al-anis.png",
        sizes: "512x512",
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

    // Recommended fields
    display: "standalone",
    theme_color: "#000000",
    background_color: "#ffffff",
    description:
      "A comprehensive educational management system for managing students, teachers, attendance, payments, and reports.",
    orientation: "portrait-primary",
    id: "al-anis-quran-center",
    screenshots: [
      {
        src: "/al-anis.jpg",
        sizes: "1280x720",
        type: "image/jpeg",
        form_factor: "wide",
      },
      {
        src: "/al-anis.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
      },
    ],

    // Optional fields
    display_override: ["standalone", "window-controls-overlay"],
    scope: "/",
    categories: ["education", "productivity"],
    lang: "am",
    dir: "ltr",
  };
}
