import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import Particles from "./Particles";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Resposta {
  id: string;
  texto: string;
  correta: boolean;
}

interface Pergunta {
  id: string;
  texto: string;
  tipo: "objetiva_gabarito" | "objetiva_perfil" | "discursiva";
  pontuacao: number;
  respostas: Resposta[];
}

interface Banner {
  emoji: string;
  titulo: string;
  descricao: string | null;
  preco: number | null;
}

export interface LojaInfo {
  id: string;
  nome: string;
}

interface ClientQuizProps {
  loja: LojaInfo;
  quizId: string;
  onComplete: (score: number) => void;
}

const ClientQuiz = ({ loja, quizId, onComplete }: ClientQuizProps) => {
  const { user } = useAuth();
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [discursivaText, setDiscursivaText] = useState("");
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Fetch perguntas + respostas for this quiz
  useEffect(() => {
    const fetch = async () => {
      const { data: perguntasData } = await supabase
        .from("perguntas")
        .select("id, texto, tipo, pontuacao")
        .eq("quiz_id", quizId)
        .order("id");

      if (!perguntasData || perguntasData.length === 0) {
        setLoading(false);
        return;
      }

      const loaded: Pergunta[] = [];
      for (const p of perguntasData) {
        const { data: respostas } = await supabase
          .from("respostas")
          .select("id, texto, correta")
          .eq("pergunta_id", p.id)
          .order("id");

        loaded.push({
          ...p,
          tipo: p.tipo as Pergunta["tipo"],
          respostas: respostas || [],
        });
      }

      setPerguntas(loaded);
      setLoading(false);
    };
    fetch();
  }, [quizId]);

  // Fetch banners ativos da loja via profile.loja_id
  useEffect(() => {
    const fetchBanners = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("loja_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.loja_id) return;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("banners")
        .select("emoji, titulo, descricao, preco")
        .eq("loja_id", profile.loja_id)
        .eq("ativo", true)
        .gte("data_fim", today);

      if (data) setBanners(data);
    };
    fetchBanners();
  }, [user, loja.id]);

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 bg-background bg-gradient-dark flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </motion.div>
    );
  }

  if (perguntas.length === 0) {
    return (
      <motion.div
        className="fixed inset-0 bg-background bg-gradient-dark flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-3xl mb-4">📭</p>
        <p className="text-foreground text-sm text-center">
          Nenhuma pergunta cadastrada neste quiz.
        </p>
      </motion.div>
    );
  }

  const q = perguntas[current];
  const progress = ((current) / perguntas.length) * 100;

  const advance = (pointsEarned: number) => {
    const newScore = score + pointsEarned;
    setScore(newScore);

    setTimeout(() => {
      setSelected(null);
      setFeedback(null);
      setDiscursivaText("");
      if (current < perguntas.length - 1) {
        setCurrent(current + 1);
      } else {
        onComplete(newScore);
      }
    }, q.tipo === "objetiva_gabarito" ? 1200 : 600);
  };

  const handleObjetivaGabarito = (resposta: Resposta) => {
    if (selected) return;
    setSelected(resposta.id);
    if (resposta.correta) {
      setFeedback("correct");
      advance(q.pontuacao);
    } else {
      setFeedback("wrong");
      advance(0);
    }
  };

  const handleObjetivaPerfil = (resposta: Resposta) => {
    if (selected) return;
    setSelected(resposta.id);
    advance(q.pontuacao);
  };

  const handleDiscursivaSubmit = () => {
    if (!discursivaText.trim()) return;
    advance(q.pontuacao);
  };

  const getOptionStyle = (resposta: Resposta) => {
    if (!selected) return "border-border bg-card hover:border-primary/50";
    if (q.tipo === "objetiva_gabarito") {
      if (resposta.correta) return "border-secondary bg-secondary/20";
      if (resposta.id === selected && !resposta.correta) return "border-destructive bg-destructive/20";
      return "border-border bg-card opacity-50";
    }
    // perfil
    if (resposta.id === selected) return "border-primary bg-primary/20 glow-gold";
    return "border-border bg-card opacity-50";
  };

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
          <span className="text-muted-foreground text-xs font-display">QUIZ • {loja.nome.toUpperCase()}</span>
          <span className="text-primary text-xs font-display">{score} PTS</span>
        </div>
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
          Pergunta {current + 1} de {perguntas.length}
        </p>
      </div>

      {/* Question area */}
      <div className="relative z-10 flex-1 flex flex-col px-4 pt-4 overflow-y-auto pb-44">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col"
          >
            <h3 className="text-foreground text-lg font-body font-semibold mb-6 leading-relaxed">
              {q.texto}
            </h3>

            {/* Objetiva gabarito */}
            {q.tipo === "objetiva_gabarito" && (
              <div className="space-y-3">
                {q.respostas.map((r) => (
                  <motion.button
                    key={r.id}
                    onClick={() => handleObjetivaGabarito(r)}
                    className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all ${getOptionStyle(r)}`}
                    whileTap={!selected ? { scale: 0.97 } : {}}
                    disabled={!!selected}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-sm">{r.texto}</span>
                      {selected && r.correta && (
                        <span className="text-secondary text-xs font-display">✓</span>
                      )}
                      {selected && r.id === selected && !r.correta && (
                        <span className="text-destructive text-xs font-display">✕</span>
                      )}
                    </div>
                  </motion.button>
                ))}
                {feedback && (
                  <motion.p
                    className={`text-center text-sm font-display mt-2 ${
                      feedback === "correct" ? "text-secondary" : "text-destructive"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {feedback === "correct" ? `🎉 Correto! +${q.pontuacao} pts` : "❌ Errou!"}
                  </motion.p>
                )}
              </div>
            )}

            {/* Objetiva perfil */}
            {q.tipo === "objetiva_perfil" && (
              <div className="space-y-3">
                {q.respostas.map((r) => (
                  <motion.button
                    key={r.id}
                    onClick={() => handleObjetivaPerfil(r)}
                    className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all ${getOptionStyle(r)}`}
                    whileTap={!selected ? { scale: 0.97 } : {}}
                    disabled={!!selected}
                  >
                    <span className="text-foreground text-sm">{r.texto}</span>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Discursiva */}
            {q.tipo === "discursiva" && (
              <div className="space-y-3">
                <Textarea
                  value={discursivaText}
                  onChange={(e) => setDiscursivaText(e.target.value)}
                  placeholder="Digite sua resposta..."
                  className="bg-muted border-border text-foreground text-sm min-h-[120px]"
                />
                <motion.button
                  onClick={handleDiscursivaSubmit}
                  disabled={!discursivaText.trim()}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display text-sm tracking-wider uppercase disabled:opacity-50 transition-all"
                  whileTap={{ scale: 0.97 }}
                >
                  Enviar Resposta
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fixed footer - banners */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-md border-t border-border px-4 pt-3 pb-4">
        <p className="text-primary text-[10px] font-display tracking-wider mb-2">
          📢 DESTAQUE DA {loja.nome.toUpperCase()} HOJE
        </p>
        {banners.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {banners.map((b, i) => (
              <div
                key={i}
                className="flex-shrink-0 bg-muted rounded-md p-2 min-w-[120px] border border-border"
              >
                <span className="text-2xl">{b.emoji || "🎁"}</span>
                <p className="text-foreground text-xs font-semibold mt-1">{b.titulo}</p>
                {b.descricao && (
                  <p className="text-muted-foreground text-[10px] mt-0.5 line-clamp-2">{b.descricao}</p>
                )}
                {b.preco != null && (
                  <p className="text-accent text-xs font-bold mt-0.5" style={{ color: "hsl(25, 95%, 53%)" }}>
                    R$ {Number(b.preco).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-[10px]">Confira nossos destaques!</p>
        )}
        <p className="text-muted-foreground text-[10px] opacity-50 mt-2 text-center">
          Powered by EYWA • Experiência Gamificada Inteligente
        </p>
      </div>
    </motion.div>
  );
};

export default ClientQuiz;
