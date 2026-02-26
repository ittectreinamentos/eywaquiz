import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Particles from "./Particles";

interface ResultScreenProps {
  score: number;
  onContinue: () => void;
}

const ResultScreen = ({ score, onContinue }: ResultScreenProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const isVip = score >= 80;

  useEffect(() => {
    let start = 0;
    const increment = Math.ceil(score / 30);
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(start);
      }
    }, 40);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-dark flex flex-col items-center justify-center overflow-hidden px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Particles count={25} />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="w-32 h-32 rounded-full border-4 border-gold flex items-center justify-center mb-6 glow-gold-strong"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
        >
          <span className="text-gold font-display text-3xl font-black">{displayScore}</span>
        </motion.div>

        <motion.p
          className="text-foreground text-lg font-body mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          🎯 Você acumulou:
        </motion.p>

        <motion.h2
          className="text-gradient-gold font-display text-2xl font-bold mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score} PONTOS
        </motion.h2>

        <motion.div
          className="bg-card border border-border rounded-xl px-6 py-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <p className="text-muted-foreground text-xs mb-1">Status EYWA do dia:</p>
          <p className="text-2xl mb-1">{isVip ? "🥇" : "🥈"}</p>
          <p className="text-gradient-gold font-display text-sm font-bold">
            {isVip ? "Cliente VIP" : "Cliente Fiel"}
          </p>
        </motion.div>

        <motion.p
          className="text-foreground text-sm font-light mb-6 max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          Agora use seus pontos como quiser na vitrine de recompensas 👇
        </motion.p>

        <motion.button
          onClick={onContinue}
          className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-display text-sm tracking-wider uppercase glow-gold-strong hover:scale-105 transition-transform"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          whileTap={{ scale: 0.95 }}
        >
          Ver Recompensas
        </motion.button>

        <motion.button
          className="mt-4 text-muted-foreground text-xs underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          📤 Compartilhar meu Nível
        </motion.button>
      </motion.div>

      <motion.p
        className="absolute bottom-6 text-muted-foreground text-[10px] opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2 }}
      >
        Powered by EYWA • Experiência Gamificada Inteligente
      </motion.p>
    </motion.div>
  );
};

export default ResultScreen;
