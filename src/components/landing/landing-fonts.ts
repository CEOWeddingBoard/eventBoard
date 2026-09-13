import { Inter, Playfair_Display } from "next/font/google";

export const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap" });

export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});
