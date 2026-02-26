import { motion } from "framer-motion";
import eywaLogo from "@/assets/eywa-logo.png";
import Particles from "./Particles";

interface EywaEntryProps {
  onComplete: () => void;
}

const EywaEntry = ({ onComplete }: EywaEntryProps) => {
  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-dark flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Particles count={30} />

      <motion.div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <motion.div
          className="animate-pulse-glow mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <img src={eywaLogo} alt="EYWA" className="w-64 h-auto drop-shadow-2xl" />
        </motion.div>

        <motion.p
          className="text-gold font-display text-sm tracking-[0.3em] uppercase mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          ✨ EYWA apresenta
        </motion.p>

        <motion.h1
          className="text-foreground text-xl font-body font-light leading-relaxed mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          Sua experiência gamificada<br />começa agora.
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-sm max-w-xs mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          Ganhe pontos. Desbloqueie recompensas. Viva a experiência.
        </motion.p>

        <motion.button
          onClick={onComplete}
          className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-display text-sm tracking-wider uppercase glow-gold-strong hover:scale-105 transition-transform"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          whileTap={{ scale: 0.95 }}
        >
          Entrar
        </motion.button>
      </motion.div>

      <motion.p
        className="absolute bottom-6 text-muted-foreground text-xs font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2.5 }}
      >
        Powered by EYWA • Experiência Gamificada Inteligente
      </motion.p>
    </motion.div>
  );
};

export default EywaEntry;
