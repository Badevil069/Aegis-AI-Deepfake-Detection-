import { motion } from 'framer-motion';

export default function PageTransition({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`page-container ${className}`.trim()}
    >
      {children}
    </motion.main>
  );
}
