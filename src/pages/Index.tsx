import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import EywaEntry from "@/components/EywaEntry";
import BakeryTransition from "@/components/BakeryTransition";
import QuizScreen from "@/components/QuizScreen";
import ResultScreen from "@/components/ResultScreen";
import RewardsScreen from "@/components/RewardsScreen";

type Screen = "entry" | "bakery" | "quiz" | "result" | "rewards";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("entry");
  const [score, setScore] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {screen === "entry" && (
          <EywaEntry key="entry" onComplete={() => setScreen("bakery")} />
        )}
        {screen === "bakery" && (
          <BakeryTransition key="bakery" onStart={() => setScreen("quiz")} />
        )}
        {screen === "quiz" && (
          <QuizScreen
            key="quiz"
            onComplete={(s) => {
              setScore(s);
              setScreen("result");
            }}
          />
        )}
        {screen === "result" && (
          <ResultScreen
            key="result"
            score={score}
            onContinue={() => setScreen("rewards")}
          />
        )}
        {screen === "rewards" && (
          <RewardsScreen key="rewards" score={score} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
