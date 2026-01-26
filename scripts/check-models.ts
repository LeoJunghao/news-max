import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY is not defined in .env.local');
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        console.log('Fetching available models using your API Key...');
        // The listModels method is available on the main GoogleGenerativeAI class instance via the API/Method direct call? 
        // Wait, the SDK exposes it via direct request or model listing. 
        // Actually, in the current Node SDK, we might need to access the 'modelManager' or just making a raw fetch if the SDK version is old/new.
        // Let's try the request method if available, or just standard SDK model listing.

        // As per standardized examples:
        // Some versions don't have listModels directly on genAI. Let's use a simple fetch to be sure.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        console.log('\n--- Available Models ---');
        if (data.models) {
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} [${m.supportedGenerationMethods.join(', ')}]`);
            });

            console.log('\n--- Recommendation ---');
            console.log('Please change the model name in src/app/api/summary/route.ts to one of the names above (without "models/" prefix usually, or WITH it if that failed).');
        } else {
            console.log('No models found in response:', data);
        }

    } catch (error: any) {
        console.error('Failed to list models:', error.message);
        if (error.message.includes('403') || error.message.includes('400')) {
            console.error('This likely means the API Key is invalid or the API "Generative Language API" is not enabled in your Google Cloud Project.');
        }
    }
}

listModels();
