import { isAxiosError } from 'axios';
import { z } from 'zod';

export const apiErrorSchema = z.object({
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export function apiErrorBody(error: unknown): ApiErrorBody | null {
  if (!isAxiosError(error)) return null;
  const parsed = apiErrorSchema.safeParse(error.response?.data);
  return parsed.success ? parsed.data : null;
}

export function apiErrorStatus(error: unknown): number | null {
  return isAxiosError(error) ? (error.response?.status ?? null) : null;
}

export function errorMessage(
  error: unknown,
  fallback = 'Something went wrong. Try again.',
) {
  return apiErrorBody(error)?.message ?? fallback;
}
