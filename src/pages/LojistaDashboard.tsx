import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Users, TrendingUp, Gift, Star, Clock, ShoppingBag, BarChart3,
  FileText, ArrowLeft, Bell, Check, X, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

// --- Mock chart data (unchanged) ---
const engagementData = [
  { day: "Seg", interacoes: 42, pontos: 1680 },
  { day: "Ter", interacoes: 58, pontos: 2320 },
  { day: "Qua", interacoes: 35, pontos: 1400 },
  { day: "Qui", interacoes: 71, pontos: 2840 },
  { day: "Sex", interacoes: 89, pontos: 3560 },
  { day: "Sáb", interacoes: 120, pontos: 4800 },
  { day: "Dom", interacoes: 95, pontos: 3800 },
];

const weeklyTrend = [
  { semana: "Sem 1", clientes: 180, resgates: 45 },
  { semana: "Sem 2", clientes: 220, resgates: 62 },
  { semana: "Sem 3", clientes: 310, resgates: 88 },
  { semana: "Sem 4", clientes: 290, resgates: 95 },
];

const topProducts = [
  { name: "Café Expresso", resgates: 89, pontos: 2670, emoji: "☕" },
  { name: "Pão de Queijo (6un)", resgates: 67, pontos: 3350, emoji: "🧀" },
  { name: "Fatia de Bolo", resgates: 45, pontos: 3150, emoji: "🍰" },
  { name: "Combo Café da Manhã", resgates: 32, pontos: 2880, emoji: "🥐" },
  { name: "Torta Inteira", resgates: 12, pontos: 1440, emoji: "🎂" },
  { name: "Vale Compras R$20", resgates: 8, pontos: 1200, emoji: "🎁" },
];

const pieData = [
  { name: "Café Expresso", value: 89, color: "hsl(32, 90%, 50%)" },
  { name: "Pão de Queijo", value: 67, color: "hsl(45, 95%, 55%)" },
  { name: "Fatia de Bolo", value: 45, color: "hsl(15, 85%, 45%)" },
  { name: "Combo Manhã", value: 32, color: "hsl(150, 50%, 30%)" },
  { name: "Outros", value: 20, color: "hsl(30, 15%, 30%)" },
];

const hourlyData = [
  { hora: "06h", clientes: 5 }, { hora: "07h", clientes: 18 },
  { hora: "08h", clientes: 35 }, { hora: "09h", clientes: 28 },
  { hora: "10h", clientes: 22 }, { hora: "11h", clientes: 15 },
  { hora: "12h", clientes: 30 }, { hora: "13h", clientes: 25 },
  { hora: "14h", clientes: 12 }, { hora: "15h", clientes: 18 },
  { hora: "16h", clientes: 28 }, { hora: "17h", clientes: 40 },
  { hora: "18h", clientes: 35 }, { hora: "19h", clientes: 20 },
  { hora: "20h", clientes: 8 },
];

const promoPerformance = [
  { promo: "Margarina Qualy", impressoes: 450, cliques: 89, conversao: "19.8%" },
  { promo: "Manteiga Aviação", impressoes: 420, cliques: 72, conversao: "17.1%" },
  { promo: "Mortadela Especial", impressoes: 380, cliques: 95, conversao: "25.0%" },
  { promo: "Queijo Minas", impressoes: 310, cliques: 68, conversao: "21.9%" },
];

const chartConfig = {
  interacoes: { label: "Interações", color: "hsl(32, 90%, 50%)" },
  pontos: { label: "Pontos", color: "hsl(45, 95%, 55%)" },
  clientes: { label: "Clientes", color: "hsl(32, 90%, 50%)" },
  resgates: { label: "Resgates", color: "hsl(150, 50%, 30%)" },
};

interface Resgate {
  id: string;
  cliente_id: string;
  recompensa_id: string;
  status: string;
  motivo_recusa: string | null;
  criado_em: string;
  profiles: { nome: string | null; email: string | null } | null;
  recompensas: { titulo: string | null; pontos_necessarios: number | null } | null;
}

const MetricCard = ({
  icon: Icon, label, value, sub, trend,
}: {
  icon: React.ElementType; label: string; value: string; sub: string; trend?: string;
}) => (
  <Card className="bg-card border-border">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        {trend && (
          <span className="text-[10px] font-display text-secondary px-1.5 py-0.5 rounded-full bg-secondary/10">
            {trend}
          </span>
        )}
      </div>
      <p className="text-foreground text-xl font-bold font-display mt-3">{value}</p>
      <p className="text-foreground text-xs font-semibold">{label}</p>
      <p className="text-muted-foreground text-[10px] mt-0.5">{sub}</p>
    </CardContent>
  </Card>
);

const LojistaDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Route protection - only lojista can access
  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== "lojista")) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, profile, navigate]);

  // Fetch resgates from Supabase
  const fetchResgates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("resgates")
      .select("*, profiles:cliente_id(nome, email), recompensas:recompensa_id(titulo, pontos_necessarios)")
      .eq("lojista_id", user.id)
      .order("criado_em", { ascending: false });
    if (data) setResgates(data as unknown as Resgate[]);
  };

  useEffect(() => {
    fetchResgates();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("resgates-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resgates", filter: `lojista_id=eq.${user.id}` },
        () => {
          fetchResgates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const pendingCount = resgates.filter((r) => r.status === "pendente").length;

  const handleConfirm = async (id: string) => {
    setProcessingId(id);
    await supabase.from("resgates").update({ status: "confirmado" }).eq("id", id);
    await fetchResgates();
    setProcessingId(null);
    toast({ title: "Resgate confirmado!", description: "O cliente foi notificado." });
  };

  const handleReject = async () => {
    if (!showRejectDialog) return;
    setProcessingId(showRejectDialog);
    await supabase.from("resgates").update({ status: "recusado", motivo_recusa: rejectReason }).eq("id", showRejectDialog);
    await fetchResgates();
    setProcessingId(null);
    setShowRejectDialog(null);
    setRejectReason("");
    toast({ title: "Resgate recusado", description: "O cliente foi notificado.", variant: "destructive" });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-dark">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-foreground text-sm font-display font-bold tracking-wide">PAINEL ADMIN</h1>
            <p className="text-muted-foreground text-[10px]">
              {profile?.nome || "Lojista"} • EYWA Analytics
            </p>
          </div>
          <button onClick={() => setActiveTab("resgates")} className="relative p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
            <Bell className="h-4 w-4 text-foreground" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted border border-border">
            <TabsTrigger value="dashboard" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="h-3 w-3 mr-1" />Dashboard
            </TabsTrigger>
            <TabsTrigger value="resgates" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              <Gift className="h-3 w-3 mr-1" />Resgates
              {pendingCount > 0 && (
                <span className="ml-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-3 w-3 mr-1" />Relatórios
            </TabsTrigger>
          </TabsList>

          {/* ===== DASHBOARD TAB ===== */}
          <TabsContent value="dashboard" className="mt-4 pb-20 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Users} label="Total Interações" value="510" sub="últimos 7 dias" trend="+18%" />
              <MetricCard icon={TrendingUp} label="Pontos Distribuídos" value="20.400" sub="últimos 7 dias" trend="+24%" />
              <MetricCard icon={Gift} label="Resgates Realizados" value={String(resgates.filter(r => r.status === "confirmado").length)} sub="confirmados" trend="+12%" />
              <MetricCard icon={ShoppingBag} label="Ticket Médio Est." value="R$18,50" sub="aumento de R$3,20" trend="+21%" />
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-foreground text-sm font-display">Engajamento Semanal</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 20%)" />
                    <XAxis dataKey="day" tick={{ fill: "hsl(30, 20%, 55%)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(30, 20%, 55%)", fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="interacoes" fill="hsl(32, 90%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-foreground text-sm font-display">Produtos Mais Resgatados</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-[10px] pl-4">Produto</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-center">Resgates</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-right pr-4">Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="py-2 pl-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{p.emoji}</span>
                            <span className="text-foreground text-xs">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground text-xs text-center font-bold">{p.resgates}</TableCell>
                        <TableCell className="text-primary text-xs text-right pr-4 font-display">{p.pontos.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-foreground text-sm font-display">Distribuição de Resgates</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex items-center">
                <div className="w-1/2 h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-foreground text-[10px] truncate">{item.name}</span>
                      <span className="text-muted-foreground text-[10px] ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== RESGATES TAB ===== */}
          <TabsContent value="resgates" className="mt-4 pb-20 space-y-4">
            <div>
              <h2 className="text-foreground text-sm font-display font-bold mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Resgates Pendentes
              </h2>
              {resgates.filter((r) => r.status === "pendente").length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-muted-foreground text-xs">Nenhum resgate pendente</p>
                  </CardContent>
                </Card>
              ) : (
                resgates
                  .filter((r) => r.status === "pendente")
                  .map((r) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <Card className="bg-card border-border mb-3 border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-foreground text-xs font-semibold">{r.profiles?.nome || "Cliente"}</p>
                              <p className="text-muted-foreground text-[10px]">{r.profiles?.email}</p>
                            </div>
                            <p className="text-muted-foreground text-[10px]">
                              {new Date(r.criado_em).toLocaleString("pt-BR", {
                                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div className="space-y-1 mb-3">
                            <div className="flex items-center gap-1">
                              <span className="text-primary text-[10px]">•</span>
                              <span className="text-foreground text-xs">{r.recompensas?.titulo}</span>
                            </div>
                          </div>
                          <p className="text-primary text-xs font-display font-bold mb-3">{r.recompensas?.pontos_necessarios} pontos</p>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleConfirm(r.id)} disabled={processingId === r.id} className="flex-1 text-[10px] font-display tracking-wider">
                              {processingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (<><Check className="h-3 w-3 mr-1" />CONFIRMAR</>)}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowRejectDialog(r.id)} disabled={processingId === r.id}
                              className="flex-1 text-[10px] font-display tracking-wider border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                              <X className="h-3 w-3 mr-1" />RECUSAR
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
              )}
            </div>

            {/* History */}
            <div>
              <h2 className="text-foreground text-sm font-display font-bold mb-3">Histórico de Resgates</h2>
              {resgates.filter((r) => r.status !== "pendente").length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center">
                    <p className="text-3xl mb-2">📋</p>
                    <p className="text-muted-foreground text-xs">Nenhum resgate no histórico</p>
                  </CardContent>
                </Card>
              ) : (
                resgates
                  .filter((r) => r.status !== "pendente")
                  .map((r) => (
                    <Card key={r.id} className={`bg-card border-border mb-2 border-l-4 ${r.status === "confirmado" ? "border-l-secondary" : "border-l-destructive"}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-foreground text-xs font-semibold">{r.profiles?.nome || "Cliente"}</p>
                            <p className="text-muted-foreground text-[10px]">{r.recompensas?.titulo}</p>
                            {r.motivo_recusa && <p className="text-destructive text-[10px] mt-1">Motivo: {r.motivo_recusa}</p>}
                          </div>
                          <span className={`text-[10px] font-display px-2 py-0.5 rounded-full ${
                            r.status === "confirmado" ? "bg-secondary/20 text-secondary-foreground" : "bg-destructive/20 text-destructive"
                          }`}>
                            {r.status === "confirmado" ? "✓ ENTREGUE" : "✕ RECUSADO"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          {/* ===== REPORTS TAB ===== */}
          <TabsContent value="reports" className="mt-4 pb-20 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <CardTitle className="text-foreground text-sm font-display">Horário de Pico</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(32, 90%, 50%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(32, 90%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 20%)" />
                    <XAxis dataKey="hora" tick={{ fill: "hsl(30, 20%, 55%)", fontSize: 9 }} />
                    <YAxis tick={{ fill: "hsl(30, 20%, 55%)", fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="clientes" stroke="hsl(32, 90%, 50%)" fill="url(#colorClientes)" strokeWidth={2} />
                  </AreaChart>
                </ChartContainer>
                <div className="px-4 mt-2 flex items-center gap-2">
                  <span className="text-primary text-lg">🔥</span>
                  <p className="text-foreground text-xs">Pico às <span className="text-primary font-bold">17h</span> com 40 clientes</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <CardTitle className="text-foreground text-sm font-display">Tendência Mensal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 15%, 20%)" />
                    <XAxis dataKey="semana" tick={{ fill: "hsl(30, 20%, 55%)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(30, 20%, 55%)", fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="clientes" stroke="hsl(32, 90%, 50%)" strokeWidth={2} dot={{ fill: "hsl(32, 90%, 50%)", r: 4 }} />
                    <Line type="monotone" dataKey="resgates" stroke="hsl(150, 50%, 30%)" strokeWidth={2} dot={{ fill: "hsl(150, 50%, 30%)", r: 4 }} />
                  </LineChart>
                </ChartContainer>
                <div className="px-4 mt-2 flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-primary" />
                    <span className="text-muted-foreground text-[10px]">Clientes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-sm bg-secondary" />
                    <span className="text-muted-foreground text-[10px]">Resgates</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <CardTitle className="text-foreground text-sm font-display">Performance das Promoções</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-[10px] pl-4">Promoção</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-center">Impressões</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-center">Cliques</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] text-right pr-4">Conv.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoPerformance.map((p, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell className="py-2 pl-4 text-foreground text-xs">{p.promo}</TableCell>
                        <TableCell className="text-foreground text-xs text-center">{p.impressoes}</TableCell>
                        <TableCell className="text-foreground text-xs text-center">{p.cliques}</TableCell>
                        <TableCell className="text-primary text-xs text-right pr-4 font-bold">{p.conversao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl mb-1">📈</p>
                  <p className="text-foreground text-lg font-bold font-display">+35%</p>
                  <p className="text-muted-foreground text-[10px]">Crescimento mensal</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl mb-1">🎯</p>
                  <p className="text-foreground text-lg font-bold font-display">78%</p>
                  <p className="text-muted-foreground text-[10px]">Taxa de retorno</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl mb-1">⭐</p>
                  <p className="text-foreground text-lg font-bold font-display">4.8</p>
                  <p className="text-muted-foreground text-[10px]">Satisfação média</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl mb-1">🔄</p>
                  <p className="text-foreground text-lg font-bold font-display">3.2x</p>
                  <p className="text-muted-foreground text-[10px]">Frequência semanal</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="px-4 py-4 text-center">
        <p className="text-muted-foreground text-[10px] opacity-50">Powered by EYWA • Painel Administrativo</p>
      </div>

      {/* Reject dialog */}
      <AlertDialog open={showRejectDialog !== null} onOpenChange={() => setShowRejectDialog(null)}>
        <AlertDialogContent className="bg-card border-border max-w-[90vw] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-display text-sm">Recusar Resgate</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Informe o motivo da recusa para notificar o cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input placeholder="Motivo da recusa..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="bg-muted border-border text-foreground text-xs" />
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 bg-muted border-border text-foreground text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={!rejectReason.trim() || processingId !== null}
              className="flex-1 text-xs font-display bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processingId !== null ? <Loader2 className="h-3 w-3 animate-spin" /> : "Recusar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LojistaDashboard;
