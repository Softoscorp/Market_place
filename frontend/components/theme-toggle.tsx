"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { PremiumIcon } from "@/components/ui/PremiumIcon";
import { useMounted } from "@/lib/hooks/useMounted";
import styles from "./theme-toggle.module.css";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return <div className={styles.placeholder} />;
  }

  return (
    <motion.button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={styles.toggleButton}
      aria-label="Toggle theme"
    >
      {theme === "dark" 
        ? <PremiumIcon icon={Sun} size={16} colorVariant="warning" containerSize={32} /> 
        : <PremiumIcon icon={Moon} size={16} colorVariant="primary" containerSize={32} />
      }
    </motion.button>
  );
}
