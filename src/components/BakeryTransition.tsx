import { motion } from "framer-motion";
import Particles from "./Particles";

interface BakeryTransitionProps {
  lojaNome?: string;
  onStart: () => void;
}

const BakeryTransition = ({ onStart }: BakeryTransitionProps) => {
  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-warm flex flex-col items-center justify-center overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Particles count={15} />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="w-24 h-24 rounded-full bg-card border-2 border-primary flex items-center justify-center mb-6 glow-ember"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <span className="text-5xl">🥖</span>
        </motion.div>

        <motion.p
          className="text-muted-foreground text-sm mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Hoje você está jogando na:
        </motion.p>

        <motion.h2
          className="text-gradient-gold font-display text-xl font-bold mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Padaria Pão Dourado
        </motion.h2>

        <motion.p
          className="text-foreground text-sm font-light mb-8 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          "Quanto mais você interage, mais você ganha."
        </motion.p>

        <motion.button
          onClick={onStart}
          className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-display text-sm tracking-wider uppercase glow-gold-strong hover:scale-105 transition-transform"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          whileTap={{ scale: 0.95 }}
        >
          👉 Começar Experiência
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default BakeryTransition;
