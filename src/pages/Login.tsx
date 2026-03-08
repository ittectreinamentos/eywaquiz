import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Particles from "@/components/Particles";
import eywaLogo from "@/assets/eywa-logo.png";
import { Loader2, User, Store } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState<"cliente" | "lojista">("cliente");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Mock login — replace with real auth later
    await new Promise((r) => setTimeout(r, 1200));

    localStorage.setItem("eywa_role", role);
    localStorage.setItem("eywa_user", JSON.stringify({ email, role }));

    toast({ title: "Login realizado com sucesso!" });

    if (role === "lojista") {
      navigate("/admin");
    } else {
      navigate("/experience");
    }
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-dark flex flex-col items-center justify-center px-6 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Particles count={8} />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <img src={eywaLogo} alt="EYWA Quiz" className="h-16 w-auto" />
          <p className="text-muted-foreground text-xs">Experiência Gamificada Inteligente</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={role} onValueChange={(v) => setRole(v as "cliente" | "lojista")}>
            <TabsList className="w-full bg-muted border border-border">
              <TabsTrigger
                value="cliente"
                className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <User className="h-3 w-3 mr-1" />
                Cliente
              </TabsTrigger>
              <TabsTrigger
                value="lojista"
                className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Store className="h-3 w-3 mr-1" />
                Lojista
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cliente" className="mt-0" />
            <TabsContent value="lojista" className="mt-0" />
          </Tabs>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleLogin}
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-primary text-xs hover:underline"
              onClick={() =>
                toast({ title: "Funcionalidade em breve", description: "Recuperação de senha será implementada com Lovable Cloud." })
              }
            >
              Esqueci minha senha
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full font-display tracking-wider text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Entrando...
              </>
            ) : (
              "ENTRAR"
            )}
          </Button>
        </motion.form>

        {/* Signup link */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-muted-foreground text-xs">
            Não tem conta?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-primary font-semibold hover:underline"
            >
              Cadastrar-me
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-muted-foreground text-[10px] text-center opacity-50 pt-4">
          Powered by EYWA • Experiência Gamificada Inteligente
        </p>
      </div>
    </motion.div>
  );
};

export default Login;
