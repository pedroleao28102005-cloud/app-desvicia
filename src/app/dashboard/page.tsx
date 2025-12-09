"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  AlertCircle,
  Award,
  LogOut,
  RefreshCw,
  Target,
  Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, signOut } from "@/lib/auth";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type UserProfile = {
  addiction_type: string;
  addiction_duration: string;
  main_trigger: string;
  main_goal: string;
};

type Streak = {
  id: string;
  start_date: string;
  days_count: number;
  is_active: boolean;
};

type Relapse = {
  id: string;
  relapse_date: string;
  trigger?: string;
  notes?: string;
};

const addictionLabels: Record<string, string> = {
  alcohol: "Álcool",
  cigarette: "Cigarro",
  pornography: "Pornografia",
  sugar: "Açúcar",
  games: "Jogos",
  social_media: "Redes Sociais",
  other: "Outros",
};

const motivationalQuotes = [
  "Cada dia limpo é uma vitória. Continue forte! 💪",
  "Você é mais forte que seus vícios. Acredite nisso! 🌟",
  "O progresso, não a perfeição, é o objetivo. 🎯",
  "Sua jornada inspira outros. Continue! 🚀",
  "Cada momento de resistência te fortalece. 💎",
];

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentStreak, setCurrentStreak] = useState<Streak | null>(null);
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [daysClean, setDaysClean] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [relapseNotes, setRelapseNotes] = useState("");
  const [relapseTrigger, setRelapseTrigger] = useState("");

  const quote =
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);

      // Carregar perfil
      const { data: profileData } = await supabase
        .from("user_profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileData) {
        router.push("/quiz");
        return;
      }
      setProfile(profileData);

      // Carregar streak ativo
      const { data: streakData } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("start_date", { ascending: false })
        .limit(1)
        .single();

      if (streakData) {
        setCurrentStreak(streakData);
        const days = differenceInDays(new Date(), new Date(streakData.start_date));
        setDaysClean(days);
      }

      // Carregar recaídas
      const { data: relapsesData } = await supabase
        .from("relapses")
        .select("*")
        .eq("user_id", user.id)
        .order("relapse_date", { ascending: false })
        .limit(10);

      if (relapsesData) {
        setRelapses(relapsesData);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterRelapse() {
    if (!userId || !currentStreak) return;

    try {
      // Registrar recaída
      const { error: relapseError } = await supabase.from("relapses").insert({
        user_id: userId,
        relapse_date: new Date().toISOString(),
        trigger: relapseTrigger,
        notes: relapseNotes,
      });

      if (relapseError) throw relapseError;

      // Finalizar streak atual
      const { error: streakError } = await supabase
        .from("streaks")
        .update({
          is_active: false,
          end_date: new Date().toISOString(),
          days_count: daysClean,
        })
        .eq("id", currentStreak.id);

      if (streakError) throw streakError;

      // Criar novo streak
      const { error: newStreakError } = await supabase.from("streaks").insert({
        user_id: userId,
        start_date: new Date().toISOString(),
        days_count: 0,
        is_active: true,
      });

      if (newStreakError) throw newStreakError;

      setShowRelapseModal(false);
      setRelapseNotes("");
      setRelapseTrigger("");
      loadDashboardData();
    } catch (error) {
      console.error("Erro ao registrar recaída:", error);
      alert("Erro ao registrar recaída. Tente novamente.");
    }
  }

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  const achievements = [
    { days: 1, label: "Primeiro Dia", unlocked: daysClean >= 1 },
    { days: 7, label: "Uma Semana", unlocked: daysClean >= 7 },
    { days: 30, label: "Um Mês", unlocked: daysClean >= 30 },
    { days: 90, label: "Três Meses", unlocked: daysClean >= 90 },
    { days: 365, label: "Um Ano", unlocked: daysClean >= 365 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-[#34D399] text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              DESVICIA
            </h1>
            <p className="text-[#6B7280]">
              Combatendo:{" "}
              <span className="text-[#34D399] font-medium">
                {profile ? addictionLabels[profile.addiction_type] : ""}
              </span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-[#1F2937] hover:bg-[#374151] rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        {/* Frase Motivacional */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#34D399] to-[#065F46] rounded-2xl p-6 mb-8"
        >
          <p className="text-[#111827] text-lg font-medium text-center">
            {quote}
          </p>
        </motion.div>

        {/* Contador Principal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#1F2937] rounded-2xl p-8 mb-8 text-center"
        >
          <Calendar className="w-12 h-12 text-[#34D399] mx-auto mb-4" />
          <div className="text-6xl md:text-8xl font-bold text-white mb-2">
            {daysClean}
          </div>
          <p className="text-[#6B7280] text-xl">
            {daysClean === 1 ? "dia limpo" : "dias limpos"}
          </p>
          <button
            onClick={() => setShowRelapseModal(true)}
            className="mt-6 px-6 py-3 bg-[#111827] hover:bg-[#374151] text-[#6B7280] hover:text-white rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <AlertCircle className="w-5 h-5" />
            Registrar Recaída
          </button>
        </motion.div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Conquistas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1F2937] rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-[#34D399]" />
              <h3 className="text-xl font-bold text-white">Conquistas</h3>
            </div>
            <div className="space-y-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.days}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    achievement.unlocked
                      ? "bg-[#34D399]/10 border border-[#34D399]/20"
                      : "bg-[#111827]"
                  }`}
                >
                  <span
                    className={
                      achievement.unlocked ? "text-[#34D399]" : "text-[#6B7280]"
                    }
                  >
                    {achievement.label}
                  </span>
                  {achievement.unlocked && (
                    <Award className="w-5 h-5 text-[#34D399]" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1F2937] rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-[#34D399]" />
              <h3 className="text-xl font-bold text-white">Estatísticas</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[#6B7280] text-sm mb-1">Total de Recaídas</p>
                <p className="text-3xl font-bold text-white">{relapses.length}</p>
              </div>
              <div>
                <p className="text-[#6B7280] text-sm mb-1">Maior Sequência</p>
                <p className="text-3xl font-bold text-[#34D399]">
                  {daysClean} dias
                </p>
              </div>
              <div>
                <p className="text-[#6B7280] text-sm mb-1">Gatilho Principal</p>
                <p className="text-lg font-medium text-white capitalize">
                  {profile?.main_trigger || "-"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Perfil */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1F2937] rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-[#34D399]" />
              <h3 className="text-xl font-bold text-white">Seu Perfil</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[#6B7280] text-sm">Vício</p>
                <p className="text-white font-medium">
                  {profile ? addictionLabels[profile.addiction_type] : "-"}
                </p>
              </div>
              <div>
                <p className="text-[#6B7280] text-sm">Duração</p>
                <p className="text-white font-medium">
                  {profile?.addiction_duration || "-"}
                </p>
              </div>
              <div>
                <p className="text-[#6B7280] text-sm">Objetivo</p>
                <p className="text-white font-medium capitalize">
                  {profile?.main_goal || "-"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Histórico de Recaídas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#1F2937] rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-[#34D399]" />
            <h3 className="text-xl font-bold text-white">
              Histórico de Recaídas
            </h3>
          </div>
          {relapses.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 text-[#34D399] mx-auto mb-3" />
              <p className="text-[#6B7280]">
                Nenhuma recaída registrada. Continue assim! 🎉
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {relapses.map((relapse) => (
                <div
                  key={relapse.id}
                  className="bg-[#111827] rounded-xl p-4 border border-[#374151]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-medium">
                      {format(new Date(relapse.relapse_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                    {relapse.trigger && (
                      <span className="text-xs bg-[#34D399]/10 text-[#34D399] px-2 py-1 rounded-lg">
                        {relapse.trigger}
                      </span>
                    )}
                  </div>
                  {relapse.notes && (
                    <p className="text-[#6B7280] text-sm">{relapse.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de Recaída */}
      {showRelapseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1F2937] rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              Registrar Recaída
            </h3>
            <p className="text-[#6B7280] mb-6">
              Não se culpe. Cada recaída é uma oportunidade de aprender.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Gatilho (opcional)
                </label>
                <input
                  type="text"
                  value={relapseTrigger}
                  onChange={(e) => setRelapseTrigger(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:border-[#34D399]"
                  placeholder="Ex: estresse, tédio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#6B7280] mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={relapseNotes}
                  onChange={(e) => setRelapseNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111827] border border-[#374151] rounded-xl text-white placeholder-[#6B7280] focus:outline-none focus:border-[#34D399] resize-none"
                  rows={3}
                  placeholder="Como você se sente? O que aprendeu?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRelapseModal(false)}
                className="flex-1 px-4 py-3 bg-[#111827] hover:bg-[#374151] text-white rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterRelapse}
                className="flex-1 px-4 py-3 bg-[#34D399] hover:bg-[#065F46] text-[#111827] font-semibold rounded-xl transition-all"
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
