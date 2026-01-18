import { invokeLLM } from "./_core/llm";

export interface MeetingAnalysis {
  equityScore: number;
  consensusLevel: number;
  participationBalance: number;
  decisionQuality: number;
  recommendations: string[];
  alerts: string[];
}

export interface DecisionRecommendation {
  decision: string;
  confidence: number;
  reasoning: string;
  alternativeApproaches: string[];
}

/**
 * Analyze meeting equity and governance metrics
 */
export async function analyzeMeetingEquity(meetingData: {
  participants: Array<{
    name: string;
    speakingTime: number;
    actionsCount: number;
    role: string;
  }>;
  decisions: Array<{
    title: string;
    votingMethod: string;
    result: string;
    consensus: number;
  }>;
  phases: Array<{
    name: string;
    duration: number;
  }>;
}): Promise<MeetingAnalysis> {
  try {
    const prompt = `
Analyze this meeting data and provide governance insights:

Participants:
${meetingData.participants.map((p) => `- ${p.name} (${p.role}): ${p.speakingTime}s speaking, ${p.actionsCount} actions`).join("\n")}

Decisions:
${meetingData.decisions.map((d) => `- ${d.title}: ${d.votingMethod}, Result: ${d.result}, Consensus: ${d.consensus}%`).join("\n")}

Phases:
${meetingData.phases.map((p) => `- ${p.name}: ${p.duration}s`).join("\n")}

Provide a JSON response with:
1. equityScore (0-100): How fairly speaking time was distributed
2. consensusLevel (0-100): Overall consensus quality
3. participationBalance (0-100): How balanced was participation
4. decisionQuality (0-100): Quality of decision-making process
5. recommendations: Array of 3-5 actionable recommendations
6. alerts: Array of any governance concerns

Format as valid JSON only.
    `;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a governance and meeting analysis expert. Analyze meeting data and provide structured insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              equityScore: { type: "number" },
              consensusLevel: { type: "number" },
              participationBalance: { type: "number" },
              decisionQuality: { type: "number" },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
              alerts: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "equityScore",
              "consensusLevel",
              "participationBalance",
              "decisionQuality",
              "recommendations",
              "alerts",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const analysis = JSON.parse(content);
    return analysis;
  } catch (error) {
    console.error("[AI Recommendations] Error analyzing meeting:", error);
    throw error;
  }
}

/**
 * Get AI recommendation for a decision
 */
export async function getDecisionRecommendation(decisionContext: {
  title: string;
  description: string;
  phase: string;
  participants: string[];
  previousDecisions: Array<{
    title: string;
    result: string;
  }>;
}): Promise<DecisionRecommendation> {
  try {
    const prompt = `
You are a strategic decision-making advisor. Based on the context, provide a recommendation for this decision:

Decision: ${decisionContext.title}
Description: ${decisionContext.description}
Phase: ${decisionContext.phase}
Participants: ${decisionContext.participants.join(", ")}

Previous similar decisions:
${decisionContext.previousDecisions.map((d) => `- ${d.title}: ${d.result}`).join("\n")}

Provide a JSON response with:
1. decision: Your recommended decision (approve/reject/defer)
2. confidence (0-100): How confident you are
3. reasoning: Explanation of your recommendation
4. alternativeApproaches: Array of 2-3 alternative approaches

Format as valid JSON only.
    `;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a strategic decision-making advisor with expertise in governance and organizational decisions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "decision_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              decision: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" },
              alternativeApproaches: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["decision", "confidence", "reasoning", "alternativeApproaches"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const recommendation = JSON.parse(content);
    return recommendation;
  } catch (error) {
    console.error("[AI Recommendations] Error getting decision recommendation:", error);
    throw error;
  }
}

/**
 * Detect governance anomalies
 */
export async function detectGovernanceAnomalies(meetingData: {
  participants: Array<{
    name: string;
    speakingTime: number;
    role: string;
  }>;
  decisions: Array<{
    votingMethod: string;
    consensus: number;
  }>;
  duration: number;
}): Promise<string[]> {
  try {
    const prompt = `
Analyze this meeting for governance anomalies and red flags:

Participants:
${meetingData.participants.map((p) => `- ${p.name} (${p.role}): ${p.speakingTime}s`).join("\n")}

Decisions:
${meetingData.decisions.map((d) => `- ${d.votingMethod}: ${d.consensus}% consensus`).join("\n")}

Meeting duration: ${meetingData.duration}s

Identify any concerning patterns or anomalies. Return a JSON array of strings describing each anomaly found.
    `;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a governance compliance expert. Identify anomalies and red flags in meeting data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "anomalies",
          strict: true,
          schema: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") {
      return [];
    }

    const anomalies = JSON.parse(content);
    return Array.isArray(anomalies) ? anomalies : [];
  } catch (error) {
    console.error("[AI Recommendations] Error detecting anomalies:", error);
    return [];
  }
}
