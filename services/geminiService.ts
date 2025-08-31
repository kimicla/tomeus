import { GoogleGenAI, Type } from "@google/genai";
import type { TranslationResult } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const schema = {
    type: Type.OBJECT,
    properties: {
        translationBlocks: {
            type: Type.ARRAY,
            description: "An array of all detected text blocks with their translations and bounding boxes for image overlay.",
            items: {
                type: Type.OBJECT,
                properties: {
                    originalText: {
                        type: Type.STRING,
                        description: 'The original text content detected in the bounding box.',
                    },
                    translatedText: {
                        type: Type.STRING,
                        description: 'The translated text content.',
                    },
                    boundingBox: {
                        type: Type.OBJECT,
                        properties: {
                            x: { type: Type.NUMBER, description: 'The left coordinate as a percentage of image width (0-100).' },
                            y: { type: Type.NUMBER, description: 'The top coordinate as a percentage of image height (0-100).' },
                            width: { type: Type.NUMBER, description: 'The width as a percentage of image width (0-100).' },
                            height: { type: Type.NUMBER, description: 'The height as a percentage of image height (0-100).' },
                        },
                        required: ['x', 'y', 'width', 'height']
                    },
                },
                required: ['originalText', 'translatedText', 'boundingBox'],
            },
        },
        formattedTranslation: {
            type: Type.STRING,
            description: "A single, well-formatted string representing the entire translated document, preserving its structure for a text-based view."
        }
    },
    required: ['translationBlocks', 'formattedTranslation']
};


export const translateImageContent = async (
    base64ImageData: string,
    mimeType: string,
    targetLanguage: string
): Promise<TranslationResult> => {
    
    const prompt = `
        You are an expert document and image analyzer and translator.
        Your task is to perform two main objectives:

        OBJECTIVE 1: DETAILED BLOCK-LEVEL TRANSLATION
        1.  Detect all distinct text blocks in the image. This includes headings, paragraphs, labels, and even small text.
        2.  For each text block, determine its precise bounding box. The bounding box coordinates (x, y) and dimensions (width, height) MUST be percentages relative to the total image dimensions.
        3.  Extract the original text from within each bounding box.
        4.  Translate the original text into ${targetLanguage}.
        5.  Compile this information into an array of "translationBlocks". This data will be used to create an interactive overlay on the original image.

        OBJECTIVE 2: FORMATTED DOCUMENT TRANSLATION
        1.  Analyze the overall logical structure of the document. Identify labels and their corresponding values (e.g., "Name: John Doe", "Address: ..."), paragraphs, and important non-text elements (like photos).
        2.  Create a single, well-formatted text string that represents the entire translated document. This string should be for display in a text-only view.
        3.  For key-value pairs, the format should be: \`OriginalLabel (TranslatedLabel): OriginalValue (TranslatedValue)\`.
        4.  For paragraphs, combine original and translated text clearly.
        5.  Arrange all content to match the original document's layout and reading flow. Use the '\\n' character for line breaks to separate distinct sections. Use '\\n\\n' for empty lines.
        6.  For non-text elements, use a descriptive placeholder, e.g., \`[Top Right - Photo of Person]\`.
        
        EXAMPLE of the formatted document string output:
        ---
        [Top Right - Photo of Person]\\n\\n姓名 (Name): 陈毛毛 (Chen Maomao)\\n\\n性别 (Sex): 男 (Male) 民族 (Ethnicity): 汉 (Han)\\n\\n公民身份号码 (Citizen ID Number): 341103199109233030\\n\\n常住户口所在地址: (Registered Permanent Residence Address)\\n江苏省南京市浦口区上城路2号13幢二单元805室 (Room 805, Unit 2, Building 13, Shangcheng Road, Pukou District, Nanjing City, Jiangsu Province)
        ---

        FINAL OUTPUT:
        Return a single JSON object that strictly adheres to the provided schema, containing both "translationBlocks" (for the overlay) and "formattedTranslation" (for the text view).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType: mimeType } },
                    { text: prompt },
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (typeof parsedJson !== 'object' || parsedJson === null || !('translationBlocks' in parsedJson) || !Array.isArray(parsedJson.translationBlocks) || !('formattedTranslation' in parsedJson) || typeof parsedJson.formattedTranslation !== 'string') {
            throw new Error("API did not return the expected object structure with 'translationBlocks' and 'formattedTranslation'.");
        }

        const blocks = parsedJson.translationBlocks;
        const isValid = blocks.every(item => 
            typeof item === 'object' &&
            item !== null &&
            'originalText' in item &&
            'translatedText' in item &&
            'boundingBox' in item &&
            typeof item.boundingBox === 'object' &&
            item.boundingBox !== null &&
            'x' in item.boundingBox &&
            'y' in item.boundingBox &&
            'width' in item.boundingBox &&
            'height' in item.boundingBox
        );

        if (!isValid) {
            throw new Error("The translated data within 'translationBlocks' is malformed.");
        }
        
        // The model might sometimes return escaped newline characters (\\n) instead of actual newlines (\n).
        // We replace them here to ensure correct rendering in the <pre> tag.
        const correctedFormattedTranslation = parsedJson.formattedTranslation.replace(/\\n/g, '\n');

        return {
            translationBlocks: blocks,
            formattedTranslation: correctedFormattedTranslation,
        };

    } catch (error) {
        console.error("Error in Gemini API call:", error);
        if (error instanceof Error) {
           throw new Error(`Failed to get translation from AI: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the AI.");
    }
};