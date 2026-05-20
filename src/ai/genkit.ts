import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // Disallow all regions except for us-central1.
      location: 'us-central1',
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
