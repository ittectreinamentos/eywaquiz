import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import Particles from "@/components/Particles";
import eywaLogo from "@/assets/eywa-logo.png";
import { Loader2, ArrowLeft } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    birthdate: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const formatCPF = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome obrigatório";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "E-mail inválido";
    if (form.cpf.replace(/\D/g, "").length !== 11) e.cpf = "CPF inválido";
    if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (!form.birthdate) e.birthdate = "Data obrigatória";
    if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Senhas não coincidem";
    if (!acceptTerms) e.terms = "Aceite os termos";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);

    toast({ title: "Cadastro realizado!", description: "Faça login para continuar." });
    navigate("/login");
  };

  const Field = ({
    label,
    field,
    type = "text",
    placeholder,
    value,
    onChange,
  }: {
    label: string;
    field: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="space-y-1">
      <label className="text-foreground text-xs font-medium">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-card border-border text-foreground placeholder:text-muted-foreground ${
          errors[field] ? "border-destructive" : ""
        }`}
      />
      {errors[field] && <p className="text-destructive text-[10px]">{errors[field]}</p>}
    </div>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-background bg-gradient-dark flex flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Particles count={6} />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div>
            <h1 className="text-foreground text-sm font-display font-bold tracking-wide">CADASTRO</h1>
            <p className="text-muted-foreground text-[10px]">Crie sua conta EYWA</p>
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center">
          <img src={eywaLogo} alt="EYWA" className="h-10 w-auto opacity-60" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nome completo" field="name" placeholder="Seu nome" value={form.name} onChange={(v) => update("name", v)} />
          <Field label="E-mail" field="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="CPF" field="cpf" placeholder="000.000.000-00" value={form.cpf} onChange={(v) => update("cpf", formatCPF(v))} />
          <Field label="Telefone" field="phone" placeholder="(00) 00000-0000" value={form.phone} onChange={(v) => update("phone", formatPhone(v))} />
          <Field label="Data de nascimento" field="birthdate" type="date" placeholder="" value={form.birthdate} onChange={(v) => update("birthdate", v)} />
          <Field label="Senha" field="password" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={(v) => update("password", v)} />
          <Field label="Confirmar senha" field="confirmPassword" type="password" placeholder="Repita a senha" value={form.confirmPassword} onChange={(v) => update("confirmPassword", v)} />

          {/* Terms */}
          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              checked={acceptTerms}
              onCheckedChange={(v) => {
                setAcceptTerms(!!v);
                setErrors((e) => ({ ...e, terms: "" }));
              }}
              className="mt-0.5"
            />
            <label className="text-muted-foreground text-[11px] leading-tight">
              Aceito os <span className="text-primary">termos de uso</span> e{" "}
              <span className="text-primary">política de privacidade</span>
            </label>
          </div>
          {errors.terms && <p className="text-destructive text-[10px]">{errors.terms}</p>}

          <Button type="submit" disabled={loading} className="w-full font-display tracking-wider text-sm mt-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Criando conta...
              </>
            ) : (
              "CRIAR CONTA"
            )}
          </Button>
        </form>

        {/* Back to login */}
        <p className="text-muted-foreground text-xs text-center">
          Já tem conta?{" "}
          <button onClick={() => navigate("/login")} className="text-primary font-semibold hover:underline">
            Fazer login
          </button>
        </p>

        <p className="text-muted-foreground text-[10px] text-center opacity-50 pt-2">
          Powered by EYWA • Experiência Gamificada Inteligente
        </p>
      </div>
    </motion.div>
  );
};

export default Signup;
