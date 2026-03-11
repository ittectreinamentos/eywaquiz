import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";

type TipoPergunta = "objetiva_gabarito" | "objetiva_perfil" | "discursiva";

interface OpcaoForm {
  texto: string;
  correta: boolean;
}

interface PerguntaForm {
  texto: string;
  tipo: TipoPergunta;
  pontuacao: number;
  opcoes: OpcaoForm[];
}

interface Quiz {
  id: string;
  titulo: string;
  status: string;
  loja_id: string;
}

interface PerguntaDB {
  id: string;
  texto: string;
  tipo: string;
  pontuacao: number;
  quiz_id: string;
}

const emptyOpcao = (): OpcaoForm => ({ texto: "", correta: false });

const emptyPergunta = (): PerguntaForm => ({
  texto: "",
  tipo: "objetiva_gabarito",
  pontuacao: 10,
  opcoes: [emptyOpcao(), emptyOpcao(), emptyOpcao(), emptyOpcao()],
});

const QuizManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingPerguntas, setExistingPerguntas] = useState<PerguntaDB[]>([]);
  const [lojaId, setLojaId] = useState<string | null>(null);

  // Create quiz modal
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizForm, setNewQuizForm] = useState({ titulo: "", status: "ativo" });
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  // Fetch quizzes for this lojista's loja
  const fetchQuizzes = async () => {
    if (!user) return;
    const { data: loja } = await supabase
      .from("lojas")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!loja) {
      setLoading(false);
      return;
    }

    setLojaId(loja.id);

    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .eq("loja_id", loja.id)
      .order("id");

    if (data) setQuizzes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, [user]);

  const handleCreateQuiz = async () => {
    if (!newQuizForm.titulo.trim() || !lojaId) {
      toast({ title: "Preencha o título do quiz", variant: "destructive" });
      return;
    }
    setCreatingQuiz(true);
    const { error } = await supabase.from("quizzes").insert({
      titulo: newQuizForm.titulo,
      status: newQuizForm.status,
      loja_id: lojaId,
    });
    if (error) {
      toast({ title: "Erro ao criar quiz", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Quiz criado com sucesso!" });
      setShowCreateQuiz(false);
      setNewQuizForm({ titulo: "", status: "ativo" });
      await fetchQuizzes();
    }
    setCreatingQuiz(false);
  };

  // Fetch existing perguntas when quiz selected
  useEffect(() => {
    if (!selectedQuiz) {
      setExistingPerguntas([]);
      setPerguntas([]);
      return;
    }
    const fetchPerguntas = async () => {
      const { data } = await supabase
        .from("perguntas")
        .select("*")
        .eq("quiz_id", selectedQuiz)
        .order("id");

      if (data && data.length > 0) {
        setExistingPerguntas(data);
        // Load each pergunta with its respostas
        const loaded: PerguntaForm[] = [];
        for (const p of data) {
          const { data: respostas } = await supabase
            .from("respostas")
            .select("*")
            .eq("pergunta_id", p.id)
            .order("id");

          const opcoes: OpcaoForm[] =
            respostas && respostas.length > 0
              ? respostas.map((r: any) => ({ texto: r.texto, correta: r.correta }))
              : [emptyOpcao(), emptyOpcao(), emptyOpcao(), emptyOpcao()];

          loaded.push({
            texto: p.texto,
            tipo: p.tipo as TipoPergunta,
            pontuacao: p.pontuacao,
            opcoes,
          });
        }
        setPerguntas(loaded);
      } else {
        setExistingPerguntas([]);
        setPerguntas([]);
      }
    };
    fetchPerguntas();
  }, [selectedQuiz]);

  const addPergunta = () => {
    setPerguntas((prev) => [...prev, emptyPergunta()]);
    setExpandedIdx(perguntas.length);
  };

  const removePergunta = (idx: number) => {
    setPerguntas((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  const updatePergunta = (idx: number, field: keyof PerguntaForm, value: any) => {
    setPerguntas((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      // Reset opcoes when switching type
      if (field === "tipo") {
        if (value === "discursiva") {
          updated[idx].opcoes = [];
        } else if (updated[idx].opcoes.length === 0) {
          updated[idx].opcoes = [emptyOpcao(), emptyOpcao(), emptyOpcao(), emptyOpcao()];
        }
        if (value === "objetiva_perfil") {
          updated[idx].opcoes = updated[idx].opcoes.map((o) => ({ ...o, correta: false }));
        }
      }
      return updated;
    });
  };

  const updateOpcao = (pIdx: number, oIdx: number, field: keyof OpcaoForm, value: any) => {
    setPerguntas((prev) => {
      const updated = [...prev];
      const opcoes = [...updated[pIdx].opcoes];
      opcoes[oIdx] = { ...opcoes[oIdx], [field]: value };
      // For gabarito, only one can be correct
      if (field === "correta" && value === true && updated[pIdx].tipo === "objetiva_gabarito") {
        opcoes.forEach((o, i) => {
          if (i !== oIdx) o.correta = false;
        });
      }
      updated[pIdx] = { ...updated[pIdx], opcoes };
      return updated;
    });
  };

  const validate = (): string | null => {
    if (perguntas.length === 0) return "Adicione pelo menos uma pergunta.";
    for (let i = 0; i < perguntas.length; i++) {
      const p = perguntas[i];
      if (!p.texto.trim()) return `Pergunta ${i + 1}: texto vazio.`;
      if (p.pontuacao <= 0) return `Pergunta ${i + 1}: pontuação deve ser > 0.`;
      if (p.tipo !== "discursiva") {
        if (p.opcoes.some((o) => !o.texto.trim())) return `Pergunta ${i + 1}: preencha todas as opções.`;
        if (p.tipo === "objetiva_gabarito" && !p.opcoes.some((o) => o.correta))
          return `Pergunta ${i + 1}: marque a resposta correta.`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedQuiz) return;
    const err = validate();
    if (err) {
      toast({ title: "Erro", description: err, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Delete existing perguntas (cascade deletes respostas via FK)
      if (existingPerguntas.length > 0) {
        const ids = existingPerguntas.map((p) => p.id);
        // Delete respostas first
        await supabase.from("respostas").delete().in("pergunta_id", ids);
        await supabase.from("perguntas").delete().in("id", ids);
      }

      // Insert new perguntas + respostas
      for (const p of perguntas) {
        const { data: inserted, error: pErr } = await supabase
          .from("perguntas")
          .insert({ texto: p.texto, tipo: p.tipo, pontuacao: p.pontuacao, quiz_id: selectedQuiz })
          .select("id")
          .single();

        if (pErr || !inserted) throw pErr;

        if (p.tipo !== "discursiva" && p.opcoes.length > 0) {
          const respostas = p.opcoes.map((o) => ({
            texto: o.texto,
            correta: p.tipo === "objetiva_gabarito" ? o.correta : false,
            pergunta_id: inserted.id,
          }));
          const { error: rErr } = await supabase.from("respostas").insert(respostas);
          if (rErr) throw rErr;
        }
      }

      toast({ title: "Salvo!", description: "Perguntas e respostas salvas com sucesso." });
      // Refresh
      setExistingPerguntas([]);
      // Re-trigger fetch
      const quizId = selectedQuiz;
      setSelectedQuiz(null);
      setTimeout(() => setSelectedQuiz(quizId), 100);
    } catch (e: any) {
      console.error("Erro ao salvar perguntas:", e);
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quiz selector + create button */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground text-xs font-display">Selecione o Quiz</Label>
            <Button size="sm" onClick={() => setShowCreateQuiz(true)} className="text-[10px] font-display tracking-wider">
              <Plus className="h-3 w-3 mr-1" />CRIAR QUIZ
            </Button>
          </div>
          {quizzes.length === 0 ? (
            <p className="text-muted-foreground text-xs">Nenhum quiz cadastrado para sua loja.</p>
          ) : (
            <Select value={selectedQuiz || ""} onValueChange={(v) => setSelectedQuiz(v)}>
              <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                <SelectValue placeholder="Escolha um quiz..." />
              </SelectTrigger>
              <SelectContent>
                {quizzes.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.titulo} ({q.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedQuiz && (
        <>
          {/* Questions list */}
          {perguntas.map((p, pIdx) => (
            <Card key={pIdx} className="bg-card border-border">
              <CardHeader
                className="px-4 py-3 cursor-pointer"
                onClick={() => setExpandedIdx(expandedIdx === pIdx ? null : pIdx)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-xs font-display">
                    Pergunta {pIdx + 1}{p.texto ? `: ${p.texto.slice(0, 40)}...` : ""}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[10px] px-2 py-0.5 rounded bg-muted">
                      {p.tipo === "objetiva_gabarito" ? "Gabarito" : p.tipo === "objetiva_perfil" ? "Perfil" : "Discursiva"}
                    </span>
                    {expandedIdx === pIdx ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedIdx === pIdx && (
                <CardContent className="px-4 pb-4 space-y-4">
                  {/* Texto */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[10px]">Texto da pergunta</Label>
                    <Input
                      value={p.texto}
                      onChange={(e) => updatePergunta(pIdx, "texto", e.target.value)}
                      placeholder="Ex: Qual é o seu café da manhã ideal?"
                      className="bg-muted border-border text-foreground text-xs"
                    />
                  </div>

                  {/* Tipo */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[10px]">Tipo</Label>
                    <Select value={p.tipo} onValueChange={(v) => updatePergunta(pIdx, "tipo", v)}>
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="objetiva_gabarito">Objetiva com gabarito (tem resposta correta)</SelectItem>
                        <SelectItem value="objetiva_perfil">Objetiva perfil (todas pontuam)</SelectItem>
                        <SelectItem value="discursiva">Discursiva (texto livre)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pontuação */}
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-[10px]">Pontuação</Label>
                    <Input
                      type="number"
                      min={1}
                      value={p.pontuacao}
                      onChange={(e) => updatePergunta(pIdx, "pontuacao", Number(e.target.value))}
                      className="bg-muted border-border text-foreground text-xs w-24"
                    />
                  </div>

                  {/* Opções (for objetivas) */}
                  {p.tipo !== "discursiva" && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-[10px]">
                        Opções de resposta
                        {p.tipo === "objetiva_gabarito" && " (marque a correta)"}
                      </Label>
                      {p.opcoes.map((o, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          {p.tipo === "objetiva_gabarito" && (
                            <RadioGroup
                              value={o.correta ? String(oIdx) : ""}
                              onValueChange={() => updateOpcao(pIdx, oIdx, "correta", true)}
                            >
                              <RadioGroupItem
                                value={String(oIdx)}
                                checked={o.correta}
                                className="shrink-0"
                              />
                            </RadioGroup>
                          )}
                          <Input
                            value={o.texto}
                            onChange={(e) => updateOpcao(pIdx, oIdx, "texto", e.target.value)}
                            placeholder={`Opção ${oIdx + 1}`}
                            className="bg-muted border-border text-foreground text-xs flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {p.tipo === "discursiva" && (
                    <p className="text-muted-foreground text-[10px] italic">
                      O cliente responderá com texto livre. Não há opções a cadastrar.
                    </p>
                  )}

                  {/* Remove */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePergunta(pIdx)}
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground text-[10px]"
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover pergunta
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={addPergunta} className="flex-1 text-xs border-border text-foreground">
              <Plus className="h-3 w-3 mr-1" /> Adicionar Pergunta
            </Button>
            <Button onClick={handleSave} disabled={saving || perguntas.length === 0} className="flex-1 text-xs font-display">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Salvar Perguntas
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuizManager;
