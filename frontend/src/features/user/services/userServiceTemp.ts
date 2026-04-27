export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = 'https://jsonplaceholder.typicode.com';

async function apiRequest<T>(endpoint: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`);
  } catch (networkError) {
    throw new ApiError(
      'Network error – unable to reach the server.',
      undefined,
      String(networkError)
    );
  }

  if (!response.ok) {
    const errorMessages: Record<number, string> = {
      400: 'Bad request – please check your input.',
      401: 'Unauthorized – please log in.',
      404: 'Requested data not found.',
      500: 'Server error – please try again later.',
    };
    const message =
      errorMessages[response.status] || `Unexpected error (${response.status})`;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  try {
    const data: T = await response.json();
    return data;
  } catch (parseError) {
    throw new ApiError('Failed to parse server response.');
  }
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users');
}

export async function getUserById(id: number): Promise<User> {
  return apiRequest<User>(`/users/${id}`);
}