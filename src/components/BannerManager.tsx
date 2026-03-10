import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Banner {
  id: string;
  loja_id: string;
  titulo: string;
  descricao: string | null;
  preco: number;
  emoji: string;
  ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
}

const emptyForm = {
  titulo: "",
  descricao: "",
  preco: "",
  emoji: "🛍️",
  ativo: true,
  data_inicio: "",
  data_fim: "",
};

const BannerManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  // Fetch loja_id for current user
  useEffect(() => {
    if (!user) return;
    const fetchLoja = async () => {
      const { data } = await supabase
        .from("lojas")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (data) setLojaId(data.id);
    };
    fetchLoja();
  }, [user]);

  // Fetch banners
  const fetchBanners = async () => {
    if (!lojaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("banners")
      .select("*")
      .eq("loja_id", lojaId)
      .order("data_inicio", { ascending: false });
    if (data) setBanners(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, [lojaId]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      titulo: b.titulo,
      descricao: b.descricao || "",
      preco: String(b.preco),
      emoji: b.emoji,
      ativo: b.ativo,
      data_inicio: b.data_inicio?.slice(0, 10) || "",
      data_fim: b.data_fim?.slice(0, 10) || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!lojaId || !form.titulo.trim() || !form.preco) {
      toast({ title: "Preencha título e preço", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      loja_id: lojaId,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      preco: parseFloat(form.preco),
      emoji: form.emoji || "🛍️",
      ativo: form.ativo,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
    };

    if (editingId) {
      await supabase.from("banners").update(payload).eq("id", editingId);
      toast({ title: "Produto atualizado!" });
    } else {
      await supabase.from("banners").insert(payload);
      toast({ title: "Produto adicionado!" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchBanners();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("banners").delete().eq("id", deleteId);
    setDeleteId(null);
    toast({ title: "Produto excluído", variant: "destructive" });
    fetchBanners();
  };

  const updateField = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading && !banners.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-sm font-display font-bold flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Produtos em Destaque
        </h2>
        <Button size="sm" onClick={openNew} className="text-[10px] font-display tracking-wider">
          <Plus className="h-3 w-3 mr-1" />ADICIONAR
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center">
            <p className="text-3xl mb-2">📦</p>
            <p className="text-muted-foreground text-xs">Nenhum produto cadastrado</p>
            <Button size="sm" variant="outline" onClick={openNew} className="mt-3 text-xs">
              <Plus className="h-3 w-3 mr-1" />Adicionar primeiro produto
            </Button>
          </CardContent>
        </Card>
      ) : (
        banners.map((b) => (
          <Card key={b.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{b.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-foreground text-xs font-semibold truncate">{b.titulo}</p>
                    <Badge variant={b.ativo ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                      {b.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {b.descricao && <p className="text-muted-foreground text-[10px] mb-1 line-clamp-1">{b.descricao}</p>}
                  <p className="text-primary text-xs font-display font-bold">
                    R$ {b.preco.toFixed(2).replace(".", ",")}
                  </p>
                  {(b.data_inicio || b.data_fim) && (
                    <p className="text-muted-foreground text-[9px] mt-1">
                      {b.data_inicio && new Date(b.data_inicio).toLocaleDateString("pt-BR")}
                      {b.data_inicio && b.data_fim && " — "}
                      {b.data_fim && new Date(b.data_fim).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(b)}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setDeleteId(b.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display text-sm">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Preencha os dados do produto em destaque.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-16">
                <Label className="text-muted-foreground text-[10px]">Emoji</Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => updateField("emoji", e.target.value)}
                  className="bg-muted border-border text-foreground text-center text-lg h-10"
                  maxLength={4}
                />
              </div>
              <div className="flex-1">
                <Label className="text-muted-foreground text-[10px]">Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => updateField("titulo", e.target.value)}
                  placeholder="Nome do produto"
                  className="bg-muted border-border text-foreground text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-[10px]">Descrição curta</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => updateField("descricao", e.target.value)}
                placeholder="Descrição opcional..."
                className="bg-muted border-border text-foreground text-xs min-h-[60px]"
                rows={2}
              />
            </div>

            <div>
              <Label className="text-muted-foreground text-[10px]">Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.preco}
                onChange={(e) => updateField("preco", e.target.value)}
                placeholder="0,00"
                className="bg-muted border-border text-foreground text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-[10px]">Data início</Label>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => updateField("data_inicio", e.target.value)}
                  className="bg-muted border-border text-foreground text-xs"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-[10px]">Data fim</Label>
                <Input
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => updateField("data_fim", e.target.value)}
                  className="bg-muted border-border text-foreground text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => updateField("ativo", v)}
              />
              <Label className="text-foreground text-xs">Produto ativo</Label>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 text-xs border-border">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 text-xs font-display tracking-wider">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : editingId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-display text-sm">Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 bg-muted border-border text-foreground text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 text-xs font-display bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BannerManager;
