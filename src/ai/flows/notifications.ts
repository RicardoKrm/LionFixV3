
'use server';

import { ai } from '../genkit';
import { z } from 'zod';

export const generateServiceNotification = ai.defineFlow(
  {
    name: 'generateServiceNotification',
    inputSchema: z.object({
      customerName: z.string(),
      vehicle: z.string(),
      serviceType: z.string(),
      status: z.string(),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { text } = await ai.generate({
        prompt: `
        You are a professional assistant for "Lion Fix Service SPA", a car repair shop.
        Your task is to generate a concise, clear, and professional notification for a customer about their vehicle's service status.
        The message should be suitable for email or a short message (like WhatsApp).

        Customer Name: ${input.customerName}
        Vehicle: ${input.vehicle}
        Service Type: ${input.serviceType}
        Current Status: ${input.status}

        Generate the notification message following these instructions:
        1. Address the customer by name in a friendly but professional manner.
        2. Clearly state the service being performed and the new status of their vehicle.
        3. If the status is 'Completado', inform them that their vehicle is ready for pickup and mention the shop's operating hours (L-V 9:00-18:00).
        4. If the status is 'Esperando Repuestos', briefly mention there's a delay due to parts availability and assure them you'll provide an update as soon as the parts arrive.
        5. If the status is 'En Reparación', simply provide a quick, reassuring update that the service is in progress as planned.
        6. Sign off as "El equipo de Lion Fix Service".
      `,
      config: { temperature: 0.3 },
    });

    return text;
  }
);

    