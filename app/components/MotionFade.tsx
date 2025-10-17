// MotionFade: Example wrapper to animate mount/unmount with Framer Motion.
// Note: Framer Motion is optional at this stage. Uncomment the import when installed.
// import { motion } from "framer-motion";
import * as React from "react";

export default function MotionFade({ children }: { children: React.ReactNode }) {
  // Placeholder without framer-motion to keep build green until installed.
  // Replace the div below with:
  // return (
  //   <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
  //     {children}
  //   </motion.div>
  // );
  return <div>{children}</div>;
}
