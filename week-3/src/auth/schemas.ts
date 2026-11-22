import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});
export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: userSchema,
});
export type Session = z.infer<typeof sessionSchema>;

export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type Credentials = z.infer<typeof credentialsSchema>;
