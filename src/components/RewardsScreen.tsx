import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Particles from "./Particles";

interface RewardsScreenProps {
  score: number;
}

const rewards = [
  { name: "Café Expresso", desc: "Grão premium torrado na hora", points: 30, emoji: "☕" },
  { name: "Pão de Queijo (6un)", desc: "Quentinho, direto do forno", points: 50, emoji: "🧀" },
  { name: "Fatia de Bolo", desc: "Chocolate belga artesanal", points: 70, emoji: "🍰" },
  { name: "Combo Café da Manhã", desc: "Pão + café + suco natural", points: 90, emoji: "🥐" },
  { name: "Torta Inteira", desc: "Torta premium para a família", points: 120, emoji: "🎂" },
  { name: "Vale Compras R$20", desc: "Use em qualquer produto", points: 150, emoji: "🎁" },
];

const RewardsScreen = ({ score }: RewardsScreenProps) => {
  const [timeLeft, setTimeLeft] = useState(600);
  const [redeemed, setRedeemed] = useState<number[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const currentScore = score - redeemed.reduce((acc, idx) => acc + rewards[idx].points, 0);

  const handleRedeem = (idx: number) => {
    if (redeemed.includes(idx)) return;
    if (currentScore >= rewards[idx].points) {
      setRedeemed([...redeemed, idx]);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-dark flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Particles count={10} />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gold font-display text-xs tracking-wider">VITRINE DE RECOMPENSAS</p>
            <p className="text-muted-foreground text-[10px]">Padaria Pão Dourado</p>
          </div>
          <div className="text-right">
            <p className="text-gold font-display text-lg font-bold">{currentScore}</p>
            <p className="text-muted-foreground text-[10px]">pontos</p>
          </div>
        </div>

        {/* Timer */}
        <div className="mt-2 flex items-center gap-2 bg-card/50 rounded-full px-3 py-1.5 border border-border">
          <span className="text-ember text-xs">⏳</span>
          <p className="text-foreground text-xs">
            Resgate em{" "}
            <span className="text-gold font-display font-bold">
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </p>
        </div>
      </div>

      {/* Rewards grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-20">
        <div className="grid grid-cols-2 gap-3 pt-2">
          {rewards.map((r, idx) => {
            const canRedeem = currentScore >= r.points && !redeemed.includes(idx);
            const isRedeemed = redeemed.includes(idx);
            const locked = currentScore < r.points && !isRedeemed;

            return (
              <motion.div
                key={idx}
                className={`rounded-xl border p-3 flex flex-col items-center text-center transition-all ${
                  isRedeemed
                    ? "border-forest bg-forest/10"
                    : canRedeem
                    ? "border-gold bg-card glow-gold"
                    : "border-border bg-card/50 opacity-60"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <span className={`text-3xl mb-2 ${locked ? "blur-[2px]" : ""}`}>{r.emoji}</span>
                <p className="text-foreground text-xs font-semibold">{r.name}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5 mb-2">{r.desc}</p>
                <p className="text-gold font-display text-xs font-bold mb-2">{r.points} pts</p>

                {isRedeemed ? (
                  <span className="text-forest-light text-[10px] font-display">✓ RESGATADO</span>
                ) : canRedeem ? (
                  <button
                    onClick={() => handleRedeem(idx)}
                    className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display tracking-wider hover:scale-105 transition-transform"
                  >
                    RESGATAR
                  </button>
                ) : (
                  <span className="text-muted-foreground text-[10px]">
                    Faltam {r.points - currentScore} pts
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Return message */}
        <motion.div
          className="mt-6 p-4 rounded-xl bg-card border border-border text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-foreground text-sm">🔄 Volte amanhã e dobre seus pontos!</p>
          <p className="text-muted-foreground text-[10px] mt-1">
            Quanto mais você joga, mais recompensas desbloqueia.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-t from-background to-transparent text-center">
        <p className="text-muted-foreground text-[10px] opacity-50">
          Powered by EYWA • Experiência Gamificada Inteligente
        </p>
      </div>
    </motion.div>
  );
};

export default RewardsScreen;
