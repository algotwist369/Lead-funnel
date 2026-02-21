import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import API_BASE_URL from "../utils/api";

// --- Icons (SVG) ---

const UpIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const DownIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TimeIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SendIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// --- Sub-Components ---

const StartScreen = ({ funnel, primaryColor, onStart }) => (
  <div className="text-center transition-all duration-700 opacity-100 px-2 flex flex-col items-center justify-center">
    <h1
      className="text-4xl sm:text-6xl font-extrabold leading-tight mb-4"
      style={{
        background: `linear-gradient(to right, #fff, ${primaryColor})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {funnel?.title || "Welcome"}
    </h1>
    <p className="text-lg sm:text-2xl font-medium opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed text-white/80">
      {funnel?.description || "Take a moment to share your preferences."}
    </p>
    <button
      onClick={onStart}
      className="w-full sm:w-auto px-10 py-4 rounded-[2rem] text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl"
      style={{ backgroundColor: primaryColor }}
    >
      Start
    </button>
    <div className="mt-6 flex items-center justify-center gap-3 opacity-60">
      <TimeIcon className="w-6 h-6" />
      <span className="text-lg font-light">Takes about 30 seconds</span>
    </div>
  </div>
);

const QuestionStep = ({ question, step, answers, onOptionSelect, onInputChange, primaryColor }) => {
  const isMulti = question.type === "multi";
  const currentAnswer = answers[`q${step}`] || "";

  return (
    <div className="transition-all duration-500 opacity-100">
      <h2 className="text-2xl sm:text-4xl font-bold leading-snug mb-6 text-white text-center">
        Q. {question.label}
      </h2>

      <div className="space-y-3">
        {(question.type === "single" || isMulti || !question.type) &&
          question.options.map((option) => {
            const isSelected = isMulti
              ? currentAnswer.split(", ").includes(option)
              : currentAnswer === option;

            return (
              <div
                key={option}
                onClick={() => onOptionSelect(option)}
                className={`p-4 sm:p-5 rounded-[1.5rem] cursor-pointer flex items-center gap-4 transition-all duration-300 border-2 ${isSelected
                  ? "bg-white/10 border-indigo-500"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}22` } : {}}
              >
                <div
                  className={`w-7 h-7 flex items-center justify-center shrink-0 border-2 transition-colors ${isMulti ? "rounded-lg" : "rounded-full"
                    } ${isSelected ? "border-white" : "border-white/40"}`}
                  style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {isSelected && <div className={`w-2.5 h-2.5 bg-white ${isMulti ? "rounded-sm" : "rounded-full"}`} />}
                </div>
                <span className={`text-xl sm:text-2xl ${isSelected ? "font-extrabold text-white" : "font-semibold text-white/80"}`}>
                  {option}
                </span>
              </div>
            );
          })}

        {(question.type === "input" || question.type === "textarea") && (
          question.type === "textarea" ? (
            <textarea
              rows={3}
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => onInputChange(`q${step}`, e.target.value)}
              className="w-full bg-white/10 border-2 border-white/20 rounded-[1.5rem] p-5 text-xl text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
              style={{ borderColor: currentAnswer ? primaryColor : "rgba(255,255,255,0.1)" }}
              autoFocus
            />
          ) : (
            <input
              type="text"
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => onInputChange(`q${step}`, e.target.value)}
              className="w-full bg-white/10 border-2 border-white/20 rounded-[1.5rem] p-5 text-xl text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors"
              style={{ borderColor: currentAnswer ? primaryColor : "rgba(255,255,255,0.1)" }}
              autoFocus
            />
          )
        )}
      </div>
    </div>
  );
};

const LeadCaptureForm = ({
  answers, onInputChange, onSubmit, isSubmitting, capture, primaryColor
}) => {
  const askName = capture.ask_name !== false;
  const askPhone = capture.ask_phone !== false;
  const askEmail = capture.ask_email === true;
  const askAddress = capture.ask_address === true;

  const inputClasses = "w-full bg-white/10 border-2 border-white/20 rounded-[1.5rem] p-5 text-lg text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <div className="transition-all duration-500 opacity-100 space-y-5">
      <p className="text-xl font-medium opacity-80 mb-4 text-center">
        Please provide your details.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
        {askName && (
          <input
            type="text"
            placeholder="Full Name"
            required
            value={answers.name}
            onChange={(e) => onInputChange("name", e.target.value)}
            className={inputClasses}
          />
        )}
        {askPhone && (
          <input
            type="tel"
            placeholder="Phone Number"
            required
            value={answers.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
            className={inputClasses}
          />
        )}
        {askEmail && (
          <input
            type="email"
            placeholder="Email Address"
            value={answers.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            className={inputClasses}
          />
        )}
        {askAddress && (
          <textarea
            placeholder="Address"
            rows={1}
            value={answers.address}
            onChange={(e) => onInputChange("address", e.target.value)}
            className={inputClasses}
          />
        )}

        <div className="text-left">
          <p className="text-lg font-bold mb-3 opacity-90">How would you like to be contacted?</p>
          <div className="flex gap-3">
            {["call", "whatsapp"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onInputChange("preferred_contact", method)}
                className={`flex-1 py-3 rounded-xl font-bold capitalize transition-all border-2 text-lg ${answers.preferred_contact === method
                  ? "bg-white text-slate-900 border-white"
                  : "border-white/20 text-white hover:bg-white/5"
                  }`}
                style={answers.preferred_contact === method ? { backgroundColor: primaryColor, borderColor: primaryColor, color: "#fff" } : { borderColor: primaryColor }}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !answers.name || !answers.phone}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] font-bold text-xl transition-all shadow-lg mt-4 disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? "Sending..." : (
            <>
              Send <SendIcon className="w-6 h-6" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

const ThankYouScreen = ({ funnel, answers, questions, primaryColor }) => (
  <div className="text-center py-6 transition-all duration-500 opacity-100">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4"
      style={{ backgroundColor: `${primaryColor}22`, borderColor: primaryColor }}
    >
      <CheckIcon className="w-10 h-10" style={{ color: primaryColor }} />
    </div>
    <h1 className="text-4xl font-extrabold mb-4">Thank You!</h1>
    <p className="text-xl opacity-90 mb-6 max-w-md mx-auto leading-relaxed">
      Our team will connect you soon, or you can contact us immediately:
    </p>

    <div className="flex flex-col gap-4 max-w-xs mx-auto">
      {funnel?.contact?.phone_number && (
        <a
          href={`tel:${funnel.contact.phone_number}`}
          className="w-full py-4 rounded-xl font-bold text-lg text-center transition-all hover:scale-105"
          style={{ backgroundColor: primaryColor }}
        >
          Call Us Now
        </a>
      )}
      {funnel?.contact?.whatsapp_number && (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://wa.me/${funnel.contact.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Hi! I'm ${answers.name}. I just completed your funnel and I'm interested.\n\n` +
            (questions || []).map((q, i) => `${q.label}: ${answers[`q${i + 1}`] || "N/A"}`).join("\n") +
            `\n\nPhone: ${answers.phone}\nEmail: ${answers.email}`
          )}`}
          className="w-full py-4 rounded-xl font-bold text-lg text-center bg-[#25D366] text-white transition-all hover:scale-105"
        >
          WhatsApp Us
        </a>
      )}
    </div>
  </div>
);

// --- Main component ---

const Home = () => {
  const { slug } = useParams();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    preferred_contact: "call",
  });

  const {
    data: funnel,
    isLoading: isFunnelLoading,
    isError: isFunnelError,
    error: funnelError,
  } = useQuery({
    queryKey: ["public-funnel", slug],
    enabled: !!slug,
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/funnels/public/${slug}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load project");
      }

      return data.funnel;
    },
  });

  useEffect(() => {
    if (funnel) {
      document.title = funnel.title || "Lead Funnel Dashboard";
      if (funnel.branding?.logo_url) new Image().src = funnel.branding.logo_url;
      if (funnel.branding?.background_image_url) new Image().src = funnel.branding.background_image_url;

      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.getElementsByTagName("head")[0].appendChild(link);
      }
      link.href = funnel.branding?.logo_url || "";
    }
  }, [funnel]);

  const baseQuestions = [
    { id: 1, label: "What type of property are you interested in?", options: ["Option 1", "Option 2", "Option 3", "Option 4"] },
    { id: 2, label: "What is your approximate budget range?", options: ["Option 1", "Option 2", "Option 3", "Option 4"] },
    { id: 3, label: "How soon are you planning to move forward?", options: ["Option 1", "Option 2", "Option 3", "Option 4"] },
  ];

  const questions = funnel?.questions?.length
    ? [...funnel.questions]
      .sort((a, b) => (a.step_number || 0) - (b.step_number || 0))
      .map((q, index) => ({
        id: q._id || index + 1,
        label: q.question_text,
        type: q.type,
        options: (q.options || []).map((o) => o.label || o.value),
      }))
    : baseQuestions;

  const questionCount = questions.length;

  const handleStart = () => {
    setStarted(true);
    setStep(1);
  };

  const handleNext = () => {
    if (!started) {
      handleStart();
      return;
    }
    const maxStep = questionCount + 2;
    setStep((prev) => (prev < maxStep ? prev + 1 : prev));
  };

  const handlePrevious = () => {
    if (started) setStep((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleOptionSelect = (value) => {
    const key = `q${step}`;
    const currentQuestion = questions[step - 1];

    if (currentQuestion.type === "multi") {
      const currentAnswers = answers[key] ? answers[key].split(", ") : [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((a) => a !== value)
        : [...currentAnswers, value];

      setAnswers(prev => ({ ...prev, [key]: newAnswers.join(", ") }));
    } else {
      setAnswers(prev => ({ ...prev, [key]: value }));
      setStep(prev => (prev < questionCount ? prev + 1 : questionCount + 1));
    }
  };

  const handleInputChange = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const submitLead = async () => {
    const payload = {
      name: answers.name,
      phone: answers.phone,
      email: answers.email,
      address: answers.address,
      preferred_contact: answers.preferred_contact || "call",
    };

    if (slug && funnel?._id) {
      payload.funnel_id = funnel._id;
      const sortedQuestions = (funnel.questions || [])
        .slice()
        .sort((a, b) => (a.step_number || 0) - (b.step_number || 0));

      payload.answers = sortedQuestions.map((q, index) => ({
        question_id: q._id,
        question_text: q.question_text,
        answer: answers[`q${index + 1}`],
      }));
    }

    const response = await fetch(`${API_BASE_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Failed to submit details");
    return data;
  };

  const { mutate: submitLeadMutation, isPending: isSubmitting, isError: isSubmitError, error: submitError } = useMutation({
    mutationFn: submitLead,
    onSuccess: () => setStep(questionCount + 2),
  });

  const backgroundImageUrl = funnel?.branding?.background_image_url || "https://media.istockphoto.com/id/517188688/photo/mountain-landscape.jpg?s=612x612&w=0&k=20&c=A63koPKaCyIwQWOTFBRWXj_PwCrR4cEoOw2S9Q7yVl8=";
  const logoUrl = funnel?.branding?.logo_url || "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg";
  const primaryColor = funnel?.branding?.primary_color || "#6366f1";
  const fontFamily = funnel?.branding?.font_family || "inherit";

  if (slug && isFunnelLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-white font-medium text-xl">
        Loading project...
      </div>
    );
  }

  if (slug && isFunnelError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-red-400 font-medium text-xl px-6 text-center">
        {funnelError?.message || "Failed to load project"}
      </div>
    );
  }

  const renderContent = () => {
    if (!started) {
      return <StartScreen funnel={funnel} primaryColor={primaryColor} onStart={handleStart} />;
    }
    if (step <= questionCount) {
      return (
        <QuestionStep
          question={questions[step - 1]}
          step={step}
          answers={answers}
          onOptionSelect={handleOptionSelect}
          onInputChange={handleInputChange}
          primaryColor={primaryColor}
        />
      );
    }
    if (step === questionCount + 1) {
      return (
        <LeadCaptureForm
          answers={answers}
          onInputChange={handleInputChange}
          onSubmit={submitLeadMutation}
          isSubmitting={isSubmitting}
          capture={funnel?.capture_step || {}}
          primaryColor={primaryColor}
        />
      );
    }
    return (
      <ThankYouScreen
        funnel={funnel}
        answers={answers}
        questions={questions}
        primaryColor={primaryColor}
      />
    );
  };

  return (
    <div
      className="h-[100dvh] w-full relative flex flex-col text-slate-100 bg-slate-950 overflow-hidden"
      style={{ fontFamily }}
    >
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] z-1" />

      {/* Header */}
      <header className="relative z-10 p-3 sm:p-5 flex justify-between items-center bg-gradient-to-b from-slate-950/60 to-transparent">
        <img src={logoUrl} alt="Logo" className="h-12 sm:h-20 w-auto object-contain drop-shadow-lg" />

        {started && step <= questionCount + 1 && (
          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm sm:text-lg font-bold text-white shadow-lg">
            {step > questionCount ? "Last step" : `${step} of ${questionCount}`}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-1.5 sm:px-4 pb-20 sm:pb-28 overflow-y-auto">
        <div className="w-full max-w-2xl bg-slate-900/20 backdrop-blur-xl rounded-[2rem] p-4 sm:p-10 border border-white/10 shadow-2xl">
          {renderContent()}

          {isSubmitError && (
            <p className="mt-2 text-red-400 text-base text-center">
              {submitError?.message || "Something went wrong. Please try again."}
            </p>
          )}
        </div>
      </main>

      {/* Navigation */}
      {started && step <= questionCount + 1 && (
        <nav className="fixed bottom-0 inset-x-0 z-20 p-4 sm:p-8 flex justify-center bg-gradient-to-t from-slate-950/80 to-transparent">
          <div className="flex items-center gap-6 sm:gap-10">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className="w-14 h-14 sm:w-20 h-20 rounded-full flex items-center justify-center bg-white/10 border border-white/10 text-white disabled:opacity-20 hover:bg-white/20 transition-all active:scale-90 shadow-lg"
            >
              <UpIcon className="w-8 h-8 sm:w-10 h-10 -rotate-90" />
            </button>

            <button
              onClick={step === questionCount + 1 ? submitLeadMutation : handleNext}
              disabled={
                isSubmitting ||
                (step <= questionCount && questions[step - 1].type !== "single" && !answers[`q${step}`]) ||
                (step > questionCount && (!answers.name || !answers.phone))
              }
              className="w-14 h-14 sm:w-20 h-20 rounded-full flex items-center justify-center text-white transition-all hover:brightness-110 active:scale-90 shadow-lg disabled:opacity-40"
              style={{ backgroundColor: primaryColor }}
            >
              {step === questionCount + 1 ? (
                <SendIcon className="w-7 h-7 sm:w-9 h-9 ml-1" />
              ) : (
                <DownIcon className="w-8 h-8 sm:w-10 h-10 -rotate-90" />
              )}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Home;
