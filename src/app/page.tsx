"use client";

import { useState, useEffect } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGithub } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Github, Loader2, Shield, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  // Verificar se já está logado
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('user_profile')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profile) {
            router.replace('/dashboard');
          } else {
            router.replace('/quiz');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkUser();

    // Verificar erros da URL
    const urlError = searchParams.get('error');
    if (urlError) {
      setError('Erro ao autenticar. Tente novamente.');
    }
  }, [router, searchParams]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = isLogin
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('user_profile')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (profile) {
          router.replace('/dashboard');
        } else {
          router.replace('/quiz');
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await signInWithGithub();
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro GitHub OAuth:', err);
      setError(err.message || "Erro ao autenticar com GitHub");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#34D399] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-[#34D399] rounded-2xl mb-4"
          >
            <Shield className="w-10 h-10 text-[#111827]" />
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">DESVICIA</h1>
          <p className="text-[#6B7280] text-lg">
            Seu aliado no combate aos vícios
          </p>
        </div>

        {/* Card de Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1F2937] rounded-2xl p-8 shadow-2xl"
        >
          {/* Toggle Login/Registro */}
          <div className="flex gap-2 mb-6 bg-[#111827] rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin
                  ? "bg-[#34D399] text-[#111827]"
                  : "text-[#6B7280] hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isLogin
                  ? "bg-[#34D399] text-[#111827]"
                  : "text-[#6B7280] hover:text-white"
              }`}
            >
              Registrar
            </button>
          </div>

          {/* Formulário */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:border-[#34D399] transition-colors"
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:border-[#34D399] transition-colors"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#34D399] hover:bg-[#065F46] text-[#111827] font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#374151]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#1F2937] text-[#6B7280]">ou</span>
            </div>
          </div>

          {/* GitHub OAuth */}
          <button
            onClick={handleGithubAuth}
            disabled={loading}
            className="w-full py-3 bg-[#111827] hover:bg-[#374151] text-white font-medium rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-[#374151]"
          >
            <Github className="w-5 h-5" />
            Continuar com GitHub
          </button>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-[#6B7280] text-sm mt-6">
          Ao continuar, você concorda com nossos termos de uso
        </p>
      </motion.div>
    </div>
  );
}
