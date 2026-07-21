"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/ui/PremiumIcon";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: 36, height: 36 }} />;
  }

  return (
    <motion.button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        color: "var(--text-primary)",
        cursor: "pointer",
        transition: "background 0.2s ease"
      }}
      aria-label="Toggle theme"
    >
      {theme === "dark" 
        ? <PremiumIcon icon={Sun} size={16} colorVariant="warning" containerSize={32} /> 
        : <PremiumIcon icon={Moon} size={16} colorVariant="primary" containerSize={32} />
      }
    </motion.button>
  );
}
