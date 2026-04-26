import { ThemeContext, type ThemeContextValue } from "@/shared/theme/ThemeProvider";
import { useContext } from "react";

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}
