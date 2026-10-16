"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

/** Re-mounts on every navigation: a short fade/slide so page changes feel continuous. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
