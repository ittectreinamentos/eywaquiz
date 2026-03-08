import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Particles from "./Particles";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface RewardsScreenProps {
  score: number;
  onBack?: () => void;
}

const rewards = [
  { name: "Café Expresso", desc: "Grão premium torrado na hora", points: 30, emoji: "☕" },
  { name: "Pão de Queijo (6un)", desc: "Quentinho, direto do forno", points: 50, emoji: "🧀" },
  { name: "Fatia de Bolo", desc: "Chocolate belga artesanal", points: 70, emoji: "🍰" },
  { name: "Combo Café da Manhã", desc: "Pão + café + suco natural", points: 90, emoji: "🥐" },
  { name: "Torta Inteira", desc: "Torta premium para a família", points: 120, emoji: "🎂" },
  { name: "Vale Compras R$20", desc: "Use em qualquer produto", points: 150, emoji: "🎁" },
];

const RewardsScreen = ({ score, onBack }: RewardsScreenProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(600);
  const [redeemed, setRedeemed] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

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

  const handleValidateResgate = async () => {
    if (!user) return;
    setValidating(true);

    try {
      // Find a lojista to associate (first one found)
      const { data: lojistas } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "lojista")
        .limit(1);

      const lojistaId = lojistas?.[0]?.id;

      // First, get or create recompensas in the DB matching our local rewards
      for (const idx of redeemed) {
        const r = rewards[idx];
        
        // Check if recompensa exists
        let { data: existing } = await supabase
          .from("recompensas")
          .select("id")
          .eq("titulo", r.name)
          .eq("ativo", true)
          .limit(1);

        let recompensaId = existing?.[0]?.id;

        if (!recompensaId && lojistaId) {
          const { data: created } = await supabase
            .from("recompensas")
            .insert({
              lojista_id: lojistaId,
              titulo: r.name,
              descricao: r.desc,
              pontos_necessarios: r.points,
              ativo: true,
            })
            .select("id")
            .single();
          recompensaId = created?.id;
        }

        if (recompensaId && lojistaId) {
          await supabase.from("resgates").insert({
            cliente_id: user.id,
            lojista_id: lojistaId,
            recompensa_id: recompensaId,
            status: "pendente",
          });
        }
      }

      setValidated(true);
      setShowConfirm(false);
      toast({
        title: "Resgate enviado!",
        description: "Aguardando validação do lojista.",
      });
    } catch (err) {
      toast({ title: "Erro ao enviar resgate", variant: "destructive" });
    } finally {
      setValidating(false);
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
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                <ArrowLeft className="h-4 w-4 text-foreground" />
              </button>
            )}
            <div>
              <p className="text-gold font-display text-xs tracking-wider">VITRINE DE RECOMPENSAS</p>
              <p className="text-muted-foreground text-[10px]">Padaria Pão Dourado</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gold font-display text-lg font-bold">{currentScore}</p>
            <p className="text-muted-foreground text-[10px]">pontos</p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 bg-card/50 rounded-full px-3 py-1.5 border border-border">
          <span className="text-ember text-xs">⏳</span>
          <p className="text-foreground text-xs">
            Resgate em{" "}
            <span className="text-gold font-display font-bold">
              {mins}:{secs.toString().padStart(2, "0")}
            </span>
          </p>
        </div>

        {validated && (
          <motion.div
            className="mt-2 px-3 py-2 rounded-lg bg-secondary/20 border border-secondary text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-secondary-foreground text-xs font-display">⏳ Aguardando validação do lojista</p>
          </motion.div>
        )}
      </div>

      {/* Rewards grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-40">
        <div className="grid grid-cols-2 gap-3 pt-2">
          {rewards.map((r, idx) => {
            const canRedeem = currentScore >= r.points && !redeemed.includes(idx);
            const isRedeemed = redeemed.includes(idx);
            const locked = currentScore < r.points && !isRedeemed;

            return (
              <motion.div
                key={idx}
                className={`rounded-xl border p-3 flex flex-col items-center text-center transition-all ${
                  isRedeemed ? "border-forest bg-forest/10"
                    : canRedeem ? "border-gold bg-card glow-gold"
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
                    disabled={validated}
                    className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-display tracking-wider hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    RESGATAR
                  </button>
                ) : (
                  <span className="text-muted-foreground text-[10px]">Faltam {r.points - currentScore} pts</span>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="mt-6 p-4 rounded-xl bg-card border border-border text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-foreground text-sm">🔄 Volte amanhã e dobre seus pontos!</p>
          <p className="text-muted-foreground text-[10px] mt-1">Quanto mais você joga, mais recompensas desbloqueia.</p>
        </motion.div>
      </div>

      {/* Validate button */}
      {redeemed.length > 0 && !validated && (
        <div className="absolute bottom-12 left-0 right-0 z-20 px-4">
          <Button onClick={() => setShowConfirm(true)} className="w-full font-display tracking-wider text-sm glow-gold-strong" size="lg">
            ✅ VALIDAR RESGATE ({redeemed.length} {redeemed.length === 1 ? "item" : "itens"})
          </Button>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 bg-gradient-to-t from-background to-transparent text-center">
        <p className="text-muted-foreground text-[10px] opacity-50">Powered by EYWA • Experiência Gamificada Inteligente</p>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-display text-sm">Confirmar Resgate</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Tem certeza que deseja confirmar o resgate dessas recompensas?
              <div className="mt-3 space-y-1">
                {redeemed.map((idx) => (
                  <div key={idx} className="flex items-center gap-2 text-foreground">
                    <span>{rewards[idx].emoji}</span>
                    <span className="text-xs">{rewards[idx].name}</span>
                    <span className="text-primary text-[10px] ml-auto font-display">{rewards[idx].points} pts</span>
                  </div>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 bg-muted border-border text-foreground text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleValidateResgate} disabled={validating} className="flex-1 text-xs font-display">
              {validating ? (<><Loader2 className="h-3 w-3 animate-spin mr-1" />Validando...</>) : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default RewardsScreen;
