import { useState } from "react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const [language, setLanguage] = useState("en");

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "fr" : "en")}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium">{language.toUpperCase()}</span>
    </button>
  );
}
