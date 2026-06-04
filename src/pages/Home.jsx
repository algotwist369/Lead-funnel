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

const normalizePhoneDigits = (phone) => phone.replace(/\D/g, "");

const isValidInternationalPhone = (phone) => {
  const trimmed = phone.trim();
  const digits = normalizePhoneDigits(trimmed);

  if (!trimmed) return false;
  if (digits.length < 7 || digits.length > 15) return false;
  if (!/^[+\d][\d\s().-]{6,24}$/.test(trimmed)) return false;
  if ((trimmed.match(/\+/g) || []).length > 1) return false;
  if (trimmed.includes("+") && !trimmed.startsWith("+")) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  return true;
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

const validateLeadAnswers = (answers, capture) => {
  const errors = {};
  const askName = capture.ask_name !== false;
  const askPhone = capture.ask_phone !== false;
  const askEmail = capture.ask_email === true;
  const askAddress = capture.ask_address === true;

  const name = answers.name.trim();
  const phone = answers.phone.trim();
  const email = answers.email.trim();
  const address = answers.address.trim();

  if (askName) {
    if (!name) errors.name = "Please enter your full name.";
    else if (name.length < 2) errors.name = "Name must be at least 2 characters.";
    else if (name.length > 80) errors.name = "Name is too long.";
    else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]{1,79}$/u.test(name)) {
      errors.name = "Use letters only, with spaces, apostrophes, dots, or hyphens.";
    }
  }

  if (askPhone) {
    if (!phone) errors.phone = "Please enter your phone number.";
    else if (!isValidInternationalPhone(phone)) {
      errors.phone = "Enter a valid international phone number, like +971 50 123 4567.";
    }
  }

  if ((askEmail || email) && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (askAddress && address && address.length < 6) {
    errors.address = "Please enter a more complete address.";
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const FieldError = ({ message }) =>
  message ? (
    <p className="mt-2 text-sm font-medium text-red-300">{message}</p>
  ) : null;

// --- Sub-Components ---

const StartScreen = ({ funnel, primaryColor, onStart }) => (
  <div className="w-full text-center transition-all duration-700 opacity-100 px-1 flex flex-col items-center justify-center">
    <h1
      className="text-[28px] sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-3 max-w-4xl text-balance"
    >
      {funnel?.title || "Welcome"}
    </h1>
    <p className="funnel-description text-sm sm:text-xl lg:text-2xl text-center font-medium opacity-90 mb-6 max-w-2xl mx-auto leading-relaxed text-white/80">
      {funnel?.description || "Take a moment to share your preferences."}
    </p>
    <button
      onClick={onStart}
      className="w-full max-w-[280px] sm:w-auto sm:min-w-52 px-7 py-3.5 sm:py-4 rounded-full text-lg sm:text-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
      style={{ backgroundColor: primaryColor }}
    >
      Start
    </button>
    <div className="mt-4 bg-white/10 border border-white/15 px-3.5 py-2 rounded-full flex items-center justify-center gap-2 text-white/80">
      <TimeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-xs sm:text-base font-medium">Takes about 30 seconds</span>
    </div>
  </div>
);

const QuestionStep = ({ question, step, answers, onOptionSelect, onInputChange, primaryColor }) => {
  const isMulti = question.type === "multi";
  const currentAnswer = answers[`q${step}`] || "";

  return (
    <div className="transition-all duration-500 opacity-100">
      <h2 className="text-[26px] sm:text-4xl lg:text-5xl font-bold leading-tight mb-5 sm:mb-8 text-white">
        Q. {question.label}
      </h2>

      <div className="flex flex-col gap-3 sm:gap-4">
        {(question.type === "single" || isMulti || !question.type) &&
          question.options.map((option) => {
            const isSelected = isMulti
              ? currentAnswer.split(", ").includes(option)
              : currentAnswer === option;

            return (
              <div
                key={option}
                onClick={() => onOptionSelect(option)}
                className={`p-3.5 sm:p-5 rounded-2xl cursor-pointer flex items-center gap-3 sm:gap-4 transition-all duration-300 border-2 min-h-14 sm:min-h-16 ${isSelected
                  ? "bg-white/10 border-indigo-500"
                  : "bg-white/20 border-white/20 hover:bg-white/10 hover:border-white/20"
                  }`}
                style={isSelected ? { borderColor: primaryColor, backgroundColor: `${primaryColor}22` } : {}}
              >
                <div
                  className={`w-6 h-6 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 border-2 transition-colors ${isMulti ? "rounded-lg" : "rounded-full"
                    } ${isSelected ? "border-white" : "border-white/40"}`}
                  style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {isSelected && <div className={`w-2.5 h-2.5 bg-white ${isMulti ? "rounded-sm" : "rounded-full"}`} />}
                </div>
                <span className={`text-base sm:text-2xl lg:text-3xl leading-snug break-words min-w-0 ${isSelected ? "font-extrabold text-white" : "font-semibold text-white/80"}`}>
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
              className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3.5 sm:p-5 text-base sm:text-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
              style={{ borderColor: currentAnswer ? primaryColor : "rgba(255,255,255,0.1)" }}
              autoFocus
            />
          ) : (
            <input
              type="text"
              placeholder="Type your answer here..."
              value={currentAnswer}
              onChange={(e) => onInputChange(`q${step}`, e.target.value)}
              className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3.5 sm:p-5 text-base sm:text-xl text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
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
  answers,
  onInputChange,
  onFieldBlur,
  onSubmit,
  capture,
  primaryColor,
  errors,
}) => {
  const askName = capture.ask_name !== false;
  const askPhone = capture.ask_phone !== false;
  const askEmail = capture.ask_email === true;
  const askAddress = capture.ask_address === true;

  const inputClasses = "w-full bg-white/15 border-2 rounded-2xl px-4 py-3.5 sm:p-5 text-base sm:text-xl text-white placeholder-white/65 focus:outline-none focus:border-indigo-500 transition-colors";

  const fieldClass = (field) =>
    `${inputClasses} ${errors[field] ? "border-red-400" : "border-white/20"}`;

  return (
    <div className="transition-all duration-500 opacity-100 space-y-4 border px-4 py-5 sm:p-6 lg:p-8 rounded-3xl bg-black/60 border-white/10 backdrop-blur-md shadow-2xl">
      <p className="text-[22px] sm:text-3xl lg:text-4xl font-semibold opacity-90 mb-4">
        Please provide your details.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3.5 sm:space-y-5">
        {askName && (
          <div>
            <input
              type="text"
              placeholder="Full Name"
              autoComplete="name"
              required
              value={answers.name}
              onBlur={() => onFieldBlur("name")}
              onChange={(e) => onInputChange("name", e.target.value)}
              className={fieldClass("name")}
              aria-invalid={Boolean(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>
        )}
        {askPhone && (
          <div>
            <input
              type="tel"
              inputMode="tel"
              placeholder="Phone Number"
              autoComplete="tel"
              required
              value={answers.phone}
              onBlur={() => onFieldBlur("phone")}
              onChange={(e) => onInputChange("phone", e.target.value)}
              className={fieldClass("phone")}
              aria-invalid={Boolean(errors.phone)}
            />
            <FieldError message={errors.phone} />
          </div>
        )}
        {askEmail && (
          <div>
            <input
              type="email"
              inputMode="email"
              placeholder="Email Address"
              autoComplete="email"
              value={answers.email}
              onBlur={() => onFieldBlur("email")}
              onChange={(e) => onInputChange("email", e.target.value)}
              className={fieldClass("email")}
              aria-invalid={Boolean(errors.email)}
            />
            <FieldError message={errors.email} />
          </div>
        )}
        {askAddress && (
          <div>
            <textarea
              placeholder="Address"
              rows={1}
              autoComplete="street-address"
              value={answers.address}
              onBlur={() => onFieldBlur("address")}
              onChange={(e) => onInputChange("address", e.target.value)}
              className={fieldClass("address")}
              aria-invalid={Boolean(errors.address)}
            />
            <FieldError message={errors.address} />
          </div>
        )}

        <div className="text-left">
          <p className="text-sm sm:text-lg font-bold mb-2.5 opacity-90">How would you like to be contacted?</p>
          <div className="grid grid-cols-2 gap-3">
            {["call", "whatsapp"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onInputChange("preferred_contact", method)}
                className={`py-3.5 sm:py-4 rounded-full font-bold capitalize transition-all border-2 text-sm sm:text-lg ${answers.preferred_contact === method
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
        <p className="text-xs sm:text-sm text-white/60 text-center pt-0.5">
          Tap Submit below when your details are ready.
        </p>
      </form>
    </div>
  );
};

const ThankYouScreen = ({ funnel, answers, questions, primaryColor }) => (
  <div className="text-center py-6 transition-all duration-500 opacity-100 px-2">
    <div
      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4"
      style={{ backgroundColor: `${primaryColor}22`, borderColor: primaryColor }}
    >
      <CheckIcon className="w-10 h-10" style={{ color: primaryColor }} />
    </div>
    <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Thank You!</h1>
    <p className="text-base sm:text-xl opacity-90 mb-3 max-w-md mx-auto leading-relaxed">
      Your details have been submitted. Our team will connect with you soon.
    </p>
    {(funnel?.contact?.phone_number || funnel?.contact?.whatsapp_number) && (
      <p className="text-sm sm:text-base text-white/75 mb-6">
        Need help right now? Contact us instantly.
      </p>
    )}

    <div className="flex flex-col gap-4 max-w-xs mx-auto">
      {funnel?.contact?.phone_number && (
        <a
          href={`tel:${funnel.contact.phone_number}`}
          className="w-full py-4 rounded-xl font-bold text-lg text-center transition-all hover:scale-[1.02] active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          Call Now
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
  const [touchedFields, setTouchedFields] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [utm] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || "",
    };
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
  const captureConfig = funnel?.capture_step || {};
  const leadValidation = validateLeadAnswers(answers, captureConfig);
  const visibleLeadErrors = Object.fromEntries(
    Object.entries(leadValidation.errors).filter(
      ([field]) => submitAttempted || touchedFields[field]
    )
  );

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

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleLeadSubmit = () => {
    setSubmitAttempted(true);
    setTouchedFields((prev) => ({
      ...prev,
      name: true,
      phone: true,
      email: true,
      address: true,
    }));

    if (!leadValidation.isValid) return;
    submitLeadMutation();
  };

  const submitLead = async () => {
    const payload = {
      name: answers.name,
      phone: answers.phone,
      email: answers.email,
      address: answers.address,
      preferred_contact: answers.preferred_contact || "call",
      utm,
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
          onFieldBlur={handleFieldBlur}
          onSubmit={handleLeadSubmit}
          isSubmitting={isSubmitting}
          capture={captureConfig}
          primaryColor={primaryColor}
          errors={visibleLeadErrors}
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
      className="min-h-dvh w-full relative flex flex-col text-slate-100 bg-slate-950 overflow-hidden"
      style={{ fontFamily }}
    >
      {/* Background Image & Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      />
      <div className="absolute inset-0 bg-slate-950/60 sm:bg-slate-950/50 backdrop-blur-[2px] z-1" />

      {/* Header */}
      <header className="relative z-10 px-3 py-2.5 sm:p-5 flex justify-between items-center gap-3">
        <img src={logoUrl} alt="Logo" className="h-10 sm:h-20 lg:h-24 max-w-[52vw] w-auto object-contain rounded-xl sm:rounded-2xl" />

        {started && step <= questionCount + 1 && (
          <div className="shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-base font-bold text-white">
            {step > questionCount ? "Last step" : `${step} of ${questionCount}`}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-3 sm:px-6 pb-24 sm:pb-28 overflow-y-auto">
        <div className="w-full max-w-5xl p-0 sm:p-6 lg:p-8">
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
        <nav className="fixed bottom-0 inset-x-0 z-20 px-3 pt-7 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-8 flex justify-center bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent">
          <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className="h-12 sm:h-16 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 bg-white/12 border border-white/15 text-white font-bold text-sm sm:text-lg disabled:opacity-30 hover:bg-white/20 transition-all active:scale-95 shadow-lg"
            >
              <UpIcon className="w-4 h-4 sm:w-6 sm:h-6 -rotate-90" />
              Back
            </button>

            <button
              onClick={step === questionCount + 1 ? handleLeadSubmit : handleNext}
              disabled={
                isSubmitting ||
                (step <= questionCount && questions[step - 1].type !== "single" && !answers[`q${step}`])
              }
              className="h-12 sm:h-16 rounded-full flex items-center justify-center gap-1.5 sm:gap-2 text-white font-bold text-sm sm:text-lg transition-all hover:brightness-110 active:scale-95 shadow-lg disabled:opacity-45"
              style={{ backgroundColor: primaryColor }}
            >
              {step === questionCount + 1 ? (
                <>
                  Submit <SendIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </>
              ) : (
                <>
                  Next <DownIcon className="w-4 h-4 sm:w-6 sm:h-6 -rotate-90" />
                </>
              )}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default Home;
