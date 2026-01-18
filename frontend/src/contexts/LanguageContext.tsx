import React, { createContext, useContext } from "react";

interface LanguageContextType {
  language: string;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  t: (key) => key,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const translations: Record<string, Record<string, string>> = {
    en: {
      "home.subtitle": "Collaborative Meeting Governance Platform",
      "home.description": "Make informed decisions with transparent voting and token-based participation.",
      "common.welcome": "Welcome",
      "home.title": "Streamline Your Meetings",
      "home.features.token": "Token-Based Participation",
      "home.features.tokenDesc": "Fair distribution of speaking time with transferable tokens.",
      "home.features.phases": "Meeting Phases",
      "home.features.phasesDesc": "Structured agenda with distinct discussion phases.",
      "home.features.equity": "Equity & Fairness",
      "home.features.equityDesc": "Ensure all voices are heard with balanced participation.",
      "home.features.traceability": "Full Traceability",
      "home.features.traceabilityDesc": "Complete audit trail of all decisions and discussions.",
      "home.createMeeting": "Create a New Meeting",
      "home.newMeeting": "Start New Meeting",
      "home.meetingTitle": "Meeting Title",
      "home.meetingTitlePlaceholder": "Enter meeting title",
      "home.meetingDescription": "Meeting Description",
      "home.meetingDescriptionPlaceholder": "Enter meeting description (optional)",
      "home.creating": "Creating...",
      "home.createButton": "Create Meeting",
      "common.cancel": "Cancel",
      "home.howItWorks": "How It Works",
      "home.step1": "Create",
      "home.step1Desc": "Set up a new meeting with title and description",
      "home.step2": "Invite",
      "home.step2Desc": "Invite participants and set token distribution",
      "home.step3": "Discuss",
      "home.step3Desc": "Use tokens to speak and participate in structured phases",
      "home.step4": "Decide",
      "home.step4Desc": "Record decisions and generate audit trails",
    },
    fr: {
      "home.subtitle": "Plateforme de gouvernance de réunion collaborative",
      "home.description": "Prenez des décisions éclairées avec un vote transparent et une participation basée sur des jetons.",
      "common.welcome": "Bienvenue",
      "home.title": "Rationalisez vos réunions",
      "home.features.token": "Participation basée sur les jetons",
      "home.features.tokenDesc": "Distribution équitable du temps de parole avec jetons transférables.",
      "home.features.phases": "Phases de réunion",
      "home.features.phasesDesc": "Agenda structuré avec phases de discussion distinctes.",
      "home.features.equity": "Équité et équanimité",
      "home.features.equityDesc": "Assurez-vous que toutes les voix sont entendues avec une participation équilibrée.",
      "home.features.traceability": "Traçabilité complète",
      "home.features.traceabilityDesc": "Piste d'audit complète de tous les décisions et discussions.",
      "home.createMeeting": "Créer une nouvelle réunion",
      "home.newMeeting": "Démarrer une nouvelle réunion",
      "home.meetingTitle": "Titre de la réunion",
      "home.meetingTitlePlaceholder": "Entrez le titre de la réunion",
      "home.meetingDescription": "Description de la réunion",
      "home.meetingDescriptionPlaceholder": "Entrez la description de la réunion (optionnel)",
      "home.creating": "Création...",
      "home.createButton": "Créer une réunion",
      "common.cancel": "Annuler",
      "home.howItWorks": "Comment ça fonctionne",
      "home.step1": "Créer",
      "home.step1Desc": "Configurez une nouvelle réunion avec titre et description",
      "home.step2": "Inviter",
      "home.step2Desc": "Invitez des participants et définissez la distribution des jetons",
      "home.step3": "Discuter",
      "home.step3Desc": "Utilisez les jetons pour parler et participer aux phases structurées",
      "home.step4": "Décider",
      "home.step4Desc": "Enregistrez les décisions et générez les pistes d'audit",
    },
  };

  const t = (key: string): string => {
    return translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: "en", t }}>
      {children}
    </LanguageContext.Provider>
  );
}
