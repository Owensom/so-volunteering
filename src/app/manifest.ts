import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SO Volunteering",
    short_name: "SO Volunteer",
    description:
      "An inclusive volunteering and employability platform helping people belong, grow and thrive.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3fff8",
    theme_color: "#f3fff8",
    orientation: "portrait-primary",
    categories: ["education", "lifestyle", "productivity"],
    icons: [
      {
        src: "/brand/so-volunteering-logo-mark.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/so-volunteering-logo-mark.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
