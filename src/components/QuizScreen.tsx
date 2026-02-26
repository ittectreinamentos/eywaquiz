import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "./Particles";

interface QuizScreenProps {
  onComplete: (score: number) => void;
}

const questions = [
  {
    question: "Qual é o seu café da manhã ideal?",
    options: [
      { text: "Pão fresquinho com manteiga", points: 20 },
      { text: "Croissant com café expresso", points: 15 },
      { text: "Bolo caseiro com suco natural", points: 18 },
      { text: "Tapioca com queijo", points: 17 },
    ],
  },
  {
    question: "Se pudesse escolher um pão especial, seria:",
    options: [
      { text: "Pão de queijo artesanal", points: 20 },
      { text: "Ciabatta com azeite", points: 15 },
      { text: "Pão integral com grãos", points: 17 },
      { text: "Baguete crocante", points: 18 },
    ],
  },
  {
    question: "Qual sobremesa te faz sorrir?",
    options: [
      { text: "Bolo de chocolate belga", points: 20 },
      { text: "Torta de limão", points: 17 },
      { text: "Pudim cremoso", points: 15 },
      { text: "Brigadeiro gourmet", points: 18 },
    ],
  },
  {
    question: "Para acompanhar seu lanche, você prefere:",
    options: [
      { text: "Cappuccino cremoso", points: 18 },
      { text: "Suco de laranja natural", points: 15 },
      { text: "Chocolate quente", points: 20 },
      { text: "Chá gelado", points: 17 },
    ],
  },
  {
    question: "O que não pode faltar na sua mesa?",
    options: [
      { text: "Queijo minas fresco", points: 20 },
      { text: "Mortadela especial", points: 17 },
      { text: "Geleia artesanal", points: 18 },
      { text: "Margarina de qualidade", points: 15 },
    ],
  },
];

const ads = [
  { emoji: "🧈", name: "Margarina Qualy", price: "R$9,90", desc: "Pote 400g" },
  { emoji: "🧈", name: "Manteiga Aviação", price: "R$10,00", desc: "Pote 200g" },
  { emoji: "🥓", name: "Mortadela Especial", price: "R$5,00", desc: "100g" },
];

const QuizScreen = ({ onComplete }: QuizScreenProps) => {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showBonus, setShowBonus] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const progress = ((current) / questions.length) * 100;
  const showAd = current === 2 || current === 4;

  const handleAnswer = (points: number, idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const newScore = score + points;
    setScore(newScore);

    // Bonus at question 3
    if (current === 2 && !showBonus) {
      setTimeout(() => setShowBonus(true), 400);
      setTimeout(() => {
        setShowBonus(false);
        setScore((s) => s + 10);
      }, 2000);
    }

    setTimeout(() => {
      setSelected(null);
      if (current < questions.length - 1) {
        setCurrent(current + 1);
      } else {
        onComplete(newScore);
      }
    }, 800);
  };

  const q = questions[current];

  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-dark flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Particles count={10} />

      {/* Header */}
      <div className="relative z-10 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-xs font-display">QUIZ EYWA</span>
          <span className="text-gold text-xs font-display">{score} PTS</span>
        </div>
        {/* Progress bar - "forno aquecendo" */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, hsl(15 85% 45%), hsl(32 90% 50%), hsl(45 95% 55%))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-muted-foreground text-[10px] mt-1">
          Pergunta {current + 1} de {questions.length}
        </p>
      </div>

      {/* Question area */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <h3 className="text-foreground text-lg font-body font-semibold mb-6 leading-relaxed">
              {q.question}
            </h3>

            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleAnswer(opt.points, idx)}
                  className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all ${
                    selected === idx
                      ? "border-primary bg-primary/20 glow-gold"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="text-foreground text-sm">{opt.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Ad section */}
        {showAd && (
          <motion.div
            className="mt-4 p-3 rounded-lg bg-card/80 border border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold text-[10px] font-display tracking-wider mb-2">
              📢 DESTAQUE DA PADARIA HOJE
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {ads.map((ad, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-muted rounded-md p-2 min-w-[120px] border border-border"
                >
                  <span className="text-2xl">{ad.emoji}</span>
                  <p className="text-foreground text-xs font-semibold mt-1">{ad.name}</p>
                  <p className="text-muted-foreground text-[10px]">{ad.desc}</p>
                  <p className="text-gold text-xs font-bold mt-1">{ad.price}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bonus popup */}
      <AnimatePresence>
        {showBonus && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border-2 border-gold rounded-2xl p-6 text-center glow-gold-strong mx-6"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-gold font-display text-sm tracking-wider">BÔNUS RELÂMPAGO!</p>
              <p className="text-foreground text-lg font-bold mt-1">+10 pontos extras</p>
              <p className="text-muted-foreground text-xs mt-1">por participar hoje!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="relative z-10 px-4 py-3 text-center">
        <p className="text-muted-foreground text-[10px] opacity-50">
          Powered by EYWA • Experiência Gamificada Inteligente
        </p>
      </div>
    </motion.div>
  );
};

export default QuizScreen;
