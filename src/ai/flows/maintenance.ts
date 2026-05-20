
'use server';

import { ai } from '../genkit';
import { z } from 'zod';

export const generateMaintenanceReminder = ai.defineFlow(
  {
    name: 'generateMaintenanceReminder',
    inputSchema: z.object({
      customerName: z.string(),
      vehicle: z.string(),
      lastServiceDate: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await ai.generate({
        prompt: `
        You are an expert copywriter for "Lion Fix Service SPA", a premium car repair shop.
        Your task is to generate a friendly, professional, and slightly persuasive maintenance reminder message for a customer.
        The message should be suitable for email or WhatsApp.
        Keep it concise and clear, focusing on the vehicle's well-being and customer care.
        
        Customer Name: ${input.customerName}
        Vehicle: ${input.vehicle}
        Last Service Date: ${input.lastServiceDate}
        
        Generate the reminder message.
        1. Start with a warm and personal greeting to the customer.
        2. Gently remind them about their specific vehicle.
        3. Explain that based on their last service date, it's the ideal time for a periodic check-up to ensure everything is running smoothly and prevent future issues.
        4. End with a clear and easy call to action, inviting them to book an appointment with us.
        5. Sign off as "El equipo de Lion Fix Service".
      `,
      config: { temperature: 0.6 },
    });

    return text;
  }
);
