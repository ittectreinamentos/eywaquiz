import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Store, Gift, BarChart3, Plus, Power, Pencil, Loader2, LogOut, Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";


interface Profile {
  id: string;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  role: string | null;
}

interface LojistaWithLoja extends Profile {
  loja?: {
    id: string;
    nome: string | null;
    cidade: string | null;
    status: string | null;
    criado_em: string | null;
  } | null;
}

interface DashboardStats {
  lojistasAtivos: number;
  totalClientes: number;
  participacoesHoje: number;
  resgatesPendentes: number;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Lojistas
  const [lojistas, setLojistas] = useState<LojistaWithLoja[]>([]);
  const [showAddLojista, setShowAddLojista] = useState(false);
  const [showEditLojista, setShowEditLojista] = useState<LojistaWithLoja | null>(null);
  const [lojistaForm, setLojistaForm] = useState({ nome: "", cidade: "", email: "", senha: "" });
  const [editForm, setEditForm] = useState({ nome: "", cidade: "" });
  const [savingLojista, setSavingLojista] = useState(false);

  // Clientes
  const [clientes, setClientes] = useState<Profile[]>([]);
  const [filtroLoja, setFiltroLoja] = useState("");

  // Stats
  const [stats, setStats] = useState<DashboardStats>({ lojistasAtivos: 0, totalClientes: 0, participacoesHoje: 0, resgatesPendentes: 0 });

  const [processing, setProcessing] = useState<string | null>(null);

  // Simple direct auth check
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      console.log("admin check - profile:", profile, "error:", error);

      if (!profile || profile.role !== "admin") {
        navigate("/login", { replace: true });
        return;
      }
      setAdminProfile(profile as Profile);
      setAuthChecked(true);
    });
  }, [navigate]);

  const fetchLojistas = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, email, cpf, telefone, role, lojas:lojas!lojas_profile_id_fkey(id, nome, cidade, status, criado_em)")
      .eq("role", "lojista");
    if (data) {
      const mapped = data.map((d: any) => ({
        ...d,
        loja: Array.isArray(d.lojas) ? d.lojas[0] ?? null : d.lojas ?? null,
      }));
      setLojistas(mapped as LojistaWithLoja[]);
    }
  };

  const fetchClientes = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome, email, cpf, telefone, role")
      .eq("role", "cliente");
    if (data) setClientes(data as Profile[]);
  };

  const fetchStats = async () => {
    const [lojRes, cliRes, resgRes] = await Promise.all([
      supabase.from("lojas").select("id", { count: "exact", head: true }).neq("status", "inativo"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "cliente"),
      supabase.from("resgates").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const { count: participacoesHoje } = await supabase
      .from("resgates")
      .select("id", { count: "exact", head: true })
      .gte("criado_em", today);

    setStats({
      lojistasAtivos: lojRes.count || 0,
      totalClientes: cliRes.count || 0,
      participacoesHoje: participacoesHoje || 0,
      resgatesPendentes: resgRes.count || 0,
    });
  };

  useEffect(() => {
    if (authChecked && adminProfile) {
      fetchLojistas();
      fetchClientes();
      fetchStats();
    }
  }, [authChecked, adminProfile]);

  const handleAddLojista = async () => {
    if (!lojistaForm.nome || !lojistaForm.email || !lojistaForm.senha) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setSavingLojista(true);

    const { data: { session: adminSession } } = await supabase.auth.getSession();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: lojistaForm.email,
      password: lojistaForm.senha,
    });

    if (authError || !authData.user) {
      toast({ title: "Erro ao criar usuário", description: authError?.message, variant: "destructive" });
      setSavingLojista(false);
      return;
    }

    const userId = authData.user.id;

    // Quando o signUp retorna sessão, garantimos contexto do novo usuário para inserts com RLS por auth.uid().
    if (authData.session) {
      await supabase.auth.setSession({
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      });
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      nome: lojistaForm.nome,
      email: lojistaForm.email,
      role: "lojista",
    });

    if (profileError) {
      console.error("Erro ao inserir profile:", profileError);
      toast({ title: "Erro ao criar perfil", description: profileError.message, variant: "destructive" });
    }

    const { error: lojaError } = await supabase.from("lojas").insert({
      profile_id: userId,
      nome: lojistaForm.nome,
      cidade: lojistaForm.cidade,
    });

    if (lojaError) {
      console.error("Erro ao inserir loja:", lojaError);
      toast({ title: "Erro ao criar loja", description: lojaError.message, variant: "destructive" });
    }

    if (adminSession) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }

    if (!profileError && !lojaError) {
      toast({ title: "Lojista cadastrado com sucesso!" });
      setShowAddLojista(false);
      setLojistaForm({ nome: "", cidade: "", email: "", senha: "" });
      fetchLojistas();
      fetchStats();
    }

    setSavingLojista(false);
  };

  const handleEditLojista = async () => {
    if (!showEditLojista) return;
    setSavingLojista(true);
    await supabase.from("profiles").update({ nome: editForm.nome }).eq("id", showEditLojista.id);
    if (showEditLojista.loja?.id) {
      await supabase.from("lojas").update({ nome: editForm.nome, cidade: editForm.cidade }).eq("id", showEditLojista.loja.id);
    }
    toast({ title: "Lojista atualizado!" });
    setShowEditLojista(null);
    setSavingLojista(false);
    fetchLojistas();
  };

  const toggleLojaStatus = async (lojaId: string, currentStatus: string | null) => {
    setProcessing(lojaId);
    const newStatus = currentStatus === "inativo" ? "ativo" : "inativo";
    await supabase.from("lojas").update({ status: newStatus }).eq("id", lojaId);
    toast({ title: `Lojista ${newStatus === "ativo" ? "ativado" : "desativado"}!` });
    setProcessing(null);
    fetchLojistas();
    fetchStats();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filteredClientes = filtroLoja
    ? clientes.filter((c) => c.nome && c.nome.toLowerCase().includes(filtroLoja.toLowerCase()))
    : clientes;

  if (!authChecked || !adminProfile) {
    return (
      <div className="min-h-screen bg-background bg-gradient-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-gradient-dark">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-foreground text-sm font-display font-bold tracking-wide">SUPER ADMIN</h1>
            <p className="text-muted-foreground text-[10px]">{adminProfile.nome || "Admin"} • EYWA Platform</p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted border border-border">
            <TabsTrigger value="dashboard" className="flex-1 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-3 w-3 mr-1" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="lojistas" className="flex-1 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Store className="h-3 w-3 mr-1" />Lojistas
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex-1 text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-3 w-3 mr-1" />Clientes
            </TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="mt-4 pb-20 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Store, label: "Lojistas Ativos", value: String(stats.lojistasAtivos), color: "text-primary" },
                { icon: Users, label: "Clientes Cadastrados", value: String(stats.totalClientes), color: "text-accent" },
                { icon: BarChart3, label: "Participações Hoje", value: String(stats.participacoesHoje), color: "text-secondary" },
                { icon: Gift, label: "Resgates Pendentes", value: String(stats.resgatesPendentes), color: "text-destructive" },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                      </div>
                      <p className="text-foreground text-xl font-bold font-display">{item.value}</p>
                      <p className="text-muted-foreground text-[10px]">{item.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* LOJISTAS */}
          <TabsContent value="lojistas" className="mt-4 pb-20 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground text-sm font-display font-bold">Lojistas</h2>
              <Button size="sm" onClick={() => setShowAddLojista(true)} className="text-[10px] font-display tracking-wider">
                <Plus className="h-3 w-3 mr-1" />CADASTRAR
              </Button>
            </div>

            {lojistas.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl mb-2">🏪</p>
                  <p className="text-muted-foreground text-xs">Nenhum lojista cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              lojistas.map((l) => (
                <Card key={l.id} className="bg-card border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-foreground text-xs font-semibold truncate">{l.nome || "—"}</p>
                          <Badge variant={l.status === "inativo" ? "destructive" : "default"} className="text-[9px] px-1.5 py-0">
                            {l.status || "ativo"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-[10px]">{l.cidade || "—"} • {l.email}</p>
                        <p className="text-muted-foreground text-[10px]">
                          Desde {l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : "—"}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={processing === l.id}
                          onClick={() => { setShowEditLojista(l); setEditForm({ nome: l.nome || "", cidade: l.cidade || "" }); }}>
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" disabled={processing === l.id}
                          onClick={() => toggleStatus(l.id, l.status, "Lojista")}>
                          {processing === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className={`h-3 w-3 ${l.status === "inativo" ? "text-secondary" : "text-destructive"}`} />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* CLIENTES */}
          <TabsContent value="clientes" className="mt-4 pb-20 space-y-3">
            <h2 className="text-foreground text-sm font-display font-bold">Clientes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome..."
                value={filtroLoja}
                onChange={(e) => setFiltroLoja(e.target.value)}
                className="bg-card border-border text-foreground text-xs pl-8"
              />
            </div>

            {filteredClientes.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl mb-2">👤</p>
                  <p className="text-muted-foreground text-xs">Nenhum cliente encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-[10px]">Nome</TableHead>
                      <TableHead className="text-muted-foreground text-[10px]">Email</TableHead>
                      <TableHead className="text-muted-foreground text-[10px]">CPF</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-center">Status</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClientes.map((c) => (
                      <TableRow key={c.id} className="border-border">
                        <TableCell className="text-foreground text-xs py-2">{c.nome || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-[10px] py-2">{c.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-[10px] py-2">{c.cpf || "—"}</TableCell>
                        <TableCell className="text-center py-2">
                          <Badge variant={c.status === "inativo" ? "destructive" : "default"} className="text-[9px] px-1.5 py-0">
                            {c.status || "ativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={processing === c.id}
                            onClick={() => toggleStatus(c.id, c.status, "Cliente")}>
                            {processing === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className={`h-3 w-3 ${c.status === "inativo" ? "text-secondary" : "text-destructive"}`} />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-muted-foreground text-[10px] opacity-50">Powered by EYWA • Super Admin</p>
      </div>

      {/* Add Lojista Dialog */}
      <Dialog open={showAddLojista} onOpenChange={setShowAddLojista}>
        <DialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display text-sm">Cadastrar Lojista</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">Preencha os dados do novo lojista.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome *" value={lojistaForm.nome} onChange={(e) => setLojistaForm((f) => ({ ...f, nome: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
            <Input placeholder="Cidade" value={lojistaForm.cidade} onChange={(e) => setLojistaForm((f) => ({ ...f, cidade: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
            <Input placeholder="Email *" type="email" value={lojistaForm.email} onChange={(e) => setLojistaForm((f) => ({ ...f, email: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
            <Input placeholder="Senha provisória *" type="password" value={lojistaForm.senha} onChange={(e) => setLojistaForm((f) => ({ ...f, senha: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAddLojista(false)} className="flex-1 text-xs border-border">Cancelar</Button>
            <Button onClick={handleAddLojista} disabled={savingLojista} className="flex-1 text-xs font-display tracking-wider">
              {savingLojista ? <Loader2 className="h-3 w-3 animate-spin" /> : "CADASTRAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lojista Dialog */}
      <Dialog open={showEditLojista !== null} onOpenChange={() => setShowEditLojista(null)}>
        <DialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display text-sm">Editar Lojista</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">Atualize os dados do lojista.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome" value={editForm.nome} onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
            <Input placeholder="Cidade" value={editForm.cidade} onChange={(e) => setEditForm((f) => ({ ...f, cidade: e.target.value }))} className="bg-muted border-border text-foreground text-xs" />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setShowEditLojista(null)} className="flex-1 text-xs border-border">Cancelar</Button>
            <Button onClick={handleEditLojista} disabled={savingLojista} className="flex-1 text-xs font-display tracking-wider">
              {savingLojista ? <Loader2 className="h-3 w-3 animate-spin" /> : "SALVAR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdmin;
