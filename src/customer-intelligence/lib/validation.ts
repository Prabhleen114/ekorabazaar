import { z } from 'zod';

export const HesitationEventSchema = z.object({
  type: z.enum(['policy_highlight', 'long_hover', 'scroll_thrashing']),
  data: z.any(),
  url: z.string().url(),
});

export type HesitationEvent = z.infer<typeof HesitationEventSchema>;
