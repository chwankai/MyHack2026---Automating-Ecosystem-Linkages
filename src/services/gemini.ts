import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateLinkageSuggestions = async (
  sourceActor: any,
  potentialTargets: any[],
  linkageType: string
) => {
  const prompt = `
    You are an AI ecosystem architect. Your task is to recommend the best matches for an ecosystem participant.
    
    SOURCE PARTICIPANT:
    ${JSON.stringify(sourceActor, null, 2)}
    
    POTENTIAL MATCHES:
    ${JSON.stringify(potentialTargets, null, 2)}
    
    LINKAGE TYPE: ${linkageType}
    
    Recommend the top 3 best matches. For each match, provide:
    1. The ID of the target.
    2. A short justification (aiJustification) explaining why this match is optimal and what the expected outcome is.
    3. A confidence score (0-1).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              targetId: { type: Type.STRING },
              justification: { type: Type.STRING },
              score: { type: Type.NUMBER }
            },
            required: ["targetId", "justification", "score"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("AI Matching failed:", error);
    return [];
  }
};

export const extractActorInfo = async (fileData: { data: string, mimeType: string }) => {
  const prompt = `
    Analyze the provided document and extract information for a new participant in an innovation ecosystem.
    
    Fields to extract:
    1. Name (Entity Name)
    2. Sector (Industry or field of expertise)
    3. Region (Geographic base or influence)
    4. Bio (Brief description of expertise and mission)
    5. Type (Choose the most appropriate: COMPANY, MENTOR, or PARTNER)

    Format the response as a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: fileData },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            sector: { type: Type.STRING },
            region: { type: Type.STRING },
            bio: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["company", "mentor", "partner"] }
          },
          required: ["name", "sector", "region", "bio", "type"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Extraction failed:", error);
    return null;
  }
};
