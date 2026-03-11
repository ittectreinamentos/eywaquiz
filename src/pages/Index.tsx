import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import EywaEntry from "@/components/EywaEntry";
import BakeryTransition from "@/components/BakeryTransition";
import ClientQuiz from "@/components/ClientQuiz";
import ResultScreen from "@/components/ResultScreen";
import RewardsScreen from "@/components/RewardsScreen";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { LojaInfo } from "@/components/ClientQuiz";

type Screen = "loading" | "entry" | "bakery" | "quiz" | "result" | "rewards";

const Index = () => {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>("loading");
  const [score, setScore] = useState(0);
  const [loja, setLoja] = useState<LojaInfo | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // Load quiz via profile.loja_id
  useEffect(() => {
    const load = async () => {
      if (!user) {
        setScreen("entry");
        return;
      }

      // Step 1: get loja_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("loja_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.loja_id) {
        // Step 2: get active quizzes for that loja
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, loja_id, titulo, status")
          .eq("loja_id", profile.loja_id)
          .eq("status", "ativo")
          .limit(1);

        const quiz = quizzes?.[0];
        if (quiz) {
          setQuizId(quiz.id);
          const { data: lojaData } = await supabase
            .from("lojas")
            .select("id, nome")
            .eq("id", quiz.loja_id)
            .maybeSingle();

          if (lojaData) setLoja(lojaData);
        }
      }
      setScreen("entry");
    };
    load();
  }, [user]);

  const handleQuizComplete = async (finalScore: number) => {
    setScore(finalScore);
    setScreen("result");

    // Save participacao and pontuacao
    if (user && loja) {
      const today = new Date().toISOString().split("T")[0];
      try {
        await supabase.from("participacoes").insert({
          cliente_id: user.id,
          loja_id: loja.id,
          data: today,
        });
        await supabase.from("pontuacoes").insert({
          cliente_id: user.id,
          loja_id: loja.id,
          pontos: finalScore,
          data: today,
        });
      } catch (e) {
        console.error("Erro ao salvar participação/pontuação:", e);
      }
    }
  };

  if (screen === "loading") {
    return (
      <div className="min-h-screen bg-background bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {screen === "entry" && (
          <EywaEntry key="entry" onComplete={() => setScreen("bakery")} />
        )}
        {screen === "bakery" && (
          <BakeryTransition
            key="bakery"
            lojaNome={loja?.nome || "Loja Parceira"}
            onStart={() => setScreen("quiz")}
          />
        )}
        {screen === "quiz" && loja && quizId && (
          <ClientQuiz
            key="quiz"
            loja={loja}
            quizId={quizId}
            onComplete={handleQuizComplete}
          />
        )}
        {screen === "quiz" && (!loja || !quizId) && (
          <div className="fixed inset-0 bg-background bg-gradient-dark flex flex-col items-center justify-center px-6">
            <p className="text-3xl mb-4">📭</p>
            <p className="text-foreground text-sm text-center">Nenhum quiz ativo disponível no momento.</p>
          </div>
        )}
        {screen === "result" && (
          <ResultScreen
            key="result"
            score={score}
            onContinue={() => setScreen("rewards")}
          />
        )}
        {screen === "rewards" && (
          <RewardsScreen
            key="rewards"
            score={score}
            onBack={() => setScreen("result")}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
