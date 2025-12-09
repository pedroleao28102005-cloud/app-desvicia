"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

const questions = [
  {
    id: 1,
    question: "Qual vício você quer combater?",
    field: "addiction_type",
    options: [
      { value: "alcohol", label: "Álcool" },
      { value: "cigarette", label: "Cigarro" },
      { value: "pornography", label: "Pornografia" },
      { value: "sugar", label: "Açúcar" },
      { value: "games", label: "Jogos" },
      { value: "social_media", label: "Redes Sociais" },
      { value: "other", label: "Outros" },
    ],
  },
  {
    id: 2,
    question: "Há quanto tempo esse hábito existe?",
    field: "addiction_duration",
    options: [
      { value: "<1", label: "Menos de 1 ano" },
      { value: "1-3", label: "1 a 3 anos" },
      { value: "3-5", label: "3 a 5 anos" },
      { value: "+5", label: "Mais de 5 anos" },
    ],
  },
  {
    id: 3,
    question: "Qual seu maior gatilho?",
    field: "main_trigger",
    options: [
      { value: "stress", label: "Estresse" },
      { value: "boredom", label: "Tédio" },
      { value: "anxiety", label: "Ansiedade" },
      { value: "environment", label: "Ambiente" },
      { value: "friends", label: "Amigos" },
      { value: "other", label: "Outros" },
    ],
  },
  {
    id: 4,
    question: "Qual o seu objetivo principal?",
    field: "main_goal",
    options: [
      { value: "stop", label: "Parar completamente" },
      { value: "reduce", label: "Reduzir consumo" },
      { value: "control", label: "Controlar recaídas" },
      { value: "understand", label: "Entender comportamento" },
    ],
  },
];

export default function QuizPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUserId(user.id);

      // Verificar se já completou o quiz
      const { data } = await supabase
        .from("user_profile")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        router.push("/dashboard");
      }
    }
    checkAuth();
  }, [router]);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const canProceed = answers[currentQuestion?.field];

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.field]: value,
    }));
  };

  const handleNext = () => {
    if (canProceed && !isLastStep) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId || !canProceed) return;

    setLoading(true);
    try {
      // Salvar perfil
      const { error: profileError } = await supabase.from("user_profile").insert({
        id: userId,
        addiction_type: answers.addiction_type,
        addiction_duration: answers.addiction_duration,
        main_trigger: answers.main_trigger,
        main_goal: answers.main_goal,
      });

      if (profileError) throw profileError;

      // Criar streak inicial
      const { error: streakError } = await supabase.from("streaks").insert({
        user_id: userId,
        start_date: new Date().toISOString(),
        days_count: 0,
        is_active: true,
      });

      if (streakError) throw streakError;

      router.push("/dashboard");
    } catch (error) {
      console.error("Erro ao salvar quiz:", error);
      alert("Erro ao salvar suas respostas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#6B7280] text-sm font-medium">
              Pergunta {currentStep + 1} de {questions.length}
            </span>
            <span className="text-[#34D399] text-sm font-medium">
              {Math.round(((currentStep + 1) / questions.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-[#1F2937] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / questions.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
              className="h-full bg-[#34D399]"
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1F2937] rounded-2xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.field] === option.value;
                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      isSelected
                        ? "bg-[#34D399] border-[#34D399] text-[#111827]"
                        : "bg-[#111827] border-[#374151] text-white hover:border-[#34D399]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.label}</span>
                      {isSelected && <Check className="w-5 h-5" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-6">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-[#1F2937] hover:bg-[#374151] text-white rounded-xl transition-all duration-300 flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Voltar
            </button>
          )}

          <button
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={!canProceed || loading}
            className="flex-1 px-6 py-3 bg-[#34D399] hover:bg-[#065F46] text-[#111827] font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              "Salvando..."
            ) : isLastStep ? (
              <>
                Finalizar
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Próxima
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
