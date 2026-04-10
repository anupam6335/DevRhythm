import type { CreateQuestionRequest, UpdateQuestionRequest } from '@/shared/types';

/**
 * Generate a pattern name from the first tag (if available)
 */
export function generatePatternFromTags(tags: string[] = []): string {
  if (!tags.length) return '';
  const firstTag = tags[0];
  return firstTag.charAt(0).toUpperCase() + firstTag.slice(1);
}

/**
 * Ensure pattern is stored as an array.
 * Backend accepts both string and array, but we prefer array for consistency.
 */
export function normalizePattern(pattern: string | string[] | undefined): string[] | undefined {
  if (!pattern) return undefined;
  return Array.isArray(pattern) ? pattern : [pattern];
}

/**
 * Prepare question payload for CREATE:
 * - Convert comma-separated strings to arrays
 * - Normalize pattern to array
 * - Remove empty fields if needed
 * Returns a valid CreateQuestionRequest.
 */
export function prepareCreateQuestionPayload(
  data: Record<string, any>
): CreateQuestionRequest {
  const payload: any = { ...data };

  // Convert tags (if string) to array
  if (typeof payload.tags === 'string') {
    payload.tags = payload.tags
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  // Convert pattern to array
  if (payload.pattern) {
    payload.pattern = normalizePattern(payload.pattern);
  }

  // Convert solutionLinks (if string) to array
  if (typeof payload.solutionLinks === 'string') {
    payload.solutionLinks = payload.solutionLinks
      .split(',')
      .map((l: string) => l.trim())
      .filter(Boolean);
  }

  // Remove empty strings/arrays if not needed
  if (payload.tags && !payload.tags.length) delete payload.tags;
  if (payload.solutionLinks && !payload.solutionLinks.length) delete payload.solutionLinks;
  if (payload.similarQuestions && !payload.similarQuestions.length) delete payload.similarQuestions;

  // Ensure required fields are present (they should be, thanks to form validation)
  return payload as CreateQuestionRequest;
}

/**
 * Prepare question payload for UPDATE (allows partial data)
 */
export function prepareUpdateQuestionPayload(
  data: Record<string, any>
): UpdateQuestionRequest {
  const payload: any = { ...data };

  // Same transformations but optional
  if (typeof payload.tags === 'string') {
    payload.tags = payload.tags
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);
  }
  if (payload.pattern) {
    payload.pattern = normalizePattern(payload.pattern);
  }
  if (typeof payload.solutionLinks === 'string') {
    payload.solutionLinks = payload.solutionLinks
      .split(',')
      .map((l: string) => l.trim())
      .filter(Boolean);
  }
  if (payload.tags && !payload.tags.length) delete payload.tags;
  if (payload.solutionLinks && !payload.solutionLinks.length) delete payload.solutionLinks;
  if (payload.similarQuestions && !payload.similarQuestions.length) delete payload.similarQuestions;

  return payload;
}