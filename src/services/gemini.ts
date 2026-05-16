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
  } catch (error: any) {
    console.error("AI Matching failed:", error);
    if (typeof window !== 'undefined') {
      window.alert("AI Error: " + (error.message || String(error)));
    }
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
    5. Type (Choose the most appropriate: COMPANY, MENTOR, PARTNER, or SERVICE_PROVIDER)
    6. Resources (Specific resources provided, especially for Partners - list key assets or offerings)

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
            type: { type: Type.STRING, enum: ["company", "mentor", "partner", "service_provider"] },
            resources: { type: Type.STRING }
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

export const assignActorToProgram = async (actor: any, programs: any[]) => {
  if (programs.length === 0) return null;

  const prompt = `
    You are an AI ecosystem manager. Given a new Venture Partner and a list of active programs, determine which program (if any) this partner is most suitable for based on their region, specialization, and resources.
    
    NEW PARTNER:
    ${JSON.stringify(actor, null, 2)}
    
    ACTIVE PROGRAMS:
    ${JSON.stringify(programs.map(p => ({ id: p.id, title: p.title, description: p.description, region: p.region })), null, 2)}
    
    Return the ID of the single most relevant program. If none are a good fit, return null.
    Format the response as a JSON object with a "programId" field (can be null).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            programId: { type: Type.STRING, nullable: true }
          },
          required: ["programId"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"programId": null}');
    return result.programId;
  } catch (error) {
    console.error("Program assignment analysis failed:", error);
    return null;
  }
};

export const suggestPartnersForProgram = async (program: any, partners: any[]) => {
  if (partners.length === 0) return [];

  const prompt = `
    You are an AI ecosystem manager. Given a new Program and a list of existing Venture Partners, identify all partners that would be suitable for this program based on their region, specialization, and resources.
    
    NEW PROGRAM:
    ${JSON.stringify(program, null, 2)}
    
    EXISTING PARTNERS:
    ${JSON.stringify(partners.map(p => ({ name: p.name, sector: p.subType, region: p.region, resources: p.resources })), null, 2)}
    
    Return a list of the names of partners that are a good fit.
    Format the response as a JSON object with a "partnerNames" field (array of strings).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            partnerNames: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["partnerNames"]
        }
      }
    });
    const result = JSON.parse(response.text || '{"partnerNames": []}');
    return result.partnerNames;
  } catch (error) {
    console.error("Partner suggestion analysis failed:", error);
    return [];
  }
};
