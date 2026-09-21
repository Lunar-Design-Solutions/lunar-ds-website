import { motion } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export const Reveal = ({ children, delay = 0, className = "", ...rest }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.9, delay, ease: EASE }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const MaskedLine = ({ children, delay = 0, as: Tag = "span" }) => (
  <span className="mask-line">
    <motion.span
      className="block will-change-transform"
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    >
      {children}
    </motion.span>
  </span>
);
