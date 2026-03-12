import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Recompensa {
  id: string;
  titulo: string;
  descricao: string | null;
  pontos_necessarios: number;
  ativo: boolean;
  lojista_id: string;
}

const RecompensaManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Recompensa | null>(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", pontos_necessarios: "" });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: loja } = await supabase
        .from("lojas")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (loja) {
        setLojaId(loja.id);
        fetchRecompensas(loja.id);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const fetchRecompensas = async (id: string) => {
    const { data } = await supabase
      .from("recompensas")
      .select("*")
      .eq("lojista_id", id)
      .order("pontos_necessarios");
    if (data) setRecompensas(data);
  };

  const handleSave = async () => {
    if (!form.titulo || !form.pontos_necessarios || !lojaId) {
      toast({ title: "Preencha título e pontos", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (editing) {
      await supabase.from("recompensas").update({
        titulo: form.titulo,
        descricao: form.descricao || null,
        pontos_necessarios: Number(form.pontos_necessarios),
      }).eq("id", editing.id);
      toast({ title: "Recompensa atualizada!" });
    } else {
      await supabase.from("recompensas").insert({
        lojista_id: lojaId,
        titulo: form.titulo,
        descricao: form.descricao || null,
        pontos_necessarios: Number(form.pontos_necessarios),
        ativo: true,
      });
      toast({ title: "Recompensa criada!" });
    }
    setShowForm(false);
    setEditing(null);
    setForm({ titulo: "", descricao: "", pontos_necessarios: "" });
    fetchRecompensas(lojaId);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("recompensas").delete().eq("id", id);
    toast({ title: "Recompensa removida!" });
    if (lojaId) fetchRecompensas(lojaId);
  };

  const toggleAtivo = async (r: Recompensa) => {
    await supabase.from("recompensas").update({ ativo: !r.ativo }).eq("id", r.id);
    if (lojaId) fetchRecompensas(lojaId);
  };

  const openEdit = (r: Recompensa) => {
    setEditing(r);
    setForm({ titulo: r.titulo, descricao: r.descricao || "", pontos_necessarios: String(r.pontos_necessarios) });
    setShowForm(true);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-sm font-display font-bold">Recompensas</h2>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ titulo: "", descricao: "", pontos_necessarios: "" }); setShowForm(true); }} className="text-[10px] font-display tracking-wider">
          <Plus className="h-3 w-3 mr-1" />ADICIONAR
        </Button>
      </div>

      {recompensas.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-muted-foreground text-xs">Nenhuma recompensa cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        recompensas.map((r) => (
          <Card key={r.id} className="bg-card border-border">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-foreground text-xs font-semibold truncate">{r.titulo}</p>
                    <Badge variant={r.ativo ? "default" : "destructive"} className="text-[9px] px-1.5 py-0 cursor-pointer" onClick={() => toggleAtivo(r)}>
                      {r.ativo ? "ativo" : "inativo"}
                    </Badge>
                  </div>
                  {r.descricao && <p className="text-muted-foreground text-[10px]">{r.descricao}</p>}
                  <p className="text-primary text-[10px] font-display font-bold mt-1">{r.pontos_necessarios} pontos</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(r)}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display text-sm">
              {editing ? "Editar Recompensa" : "Nova Recompensa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm(f => ({ ...f, titulo: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
            <Input placeholder="Descrição" value={form.descricao} onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
            <Input placeholder="Pontos necessários *" type="number" value={form.pontos_necessarios} onChange={(e) => setForm(f => ({ ...f, pontos_necessarios: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 text-xs border-border">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 text-xs font-display tracking-wider">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "SALVAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecompensaManager;
