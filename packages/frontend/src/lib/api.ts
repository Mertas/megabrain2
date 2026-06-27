const BASE_URL = 'http://localhost:3001/api'

export interface UserPublic {
  id: number
  login: string
  email: string
  nickname: string
  level: number
  icon: string
  created_at: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginResult extends AuthTokens {
  user: UserPublic
}

export interface ApiErrorDetail {
  path: string
  message: string
}

export class ApiError extends Error {
  code: string
  status: number
  details: ApiErrorDetail[]

  constructor(
    message: string,
    code: string,
    status: number,
    details: ApiErrorDetail[] = [],
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && retry && token) {
    try {
      const newTokens = await refreshTokens()
      headers['Authorization'] = `Bearer ${newTokens.accessToken}`
      const retryRes = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({ message: 'Network error' }))
        throw new ApiError(body.message || body.error || `HTTP ${retryRes.status}`, body.error || 'UNKNOWN', retryRes.status, body.details || [])
      }
      return retryRes.json()
    } catch {
      logout()
      throw new ApiError('UNAUTHORIZED', 'Сессия истекла, войдите заново', 401)
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Network error' }))
    throw new ApiError(
      body.message || body.error || `HTTP ${res.status}`,
      body.error || 'UNKNOWN',
      res.status,
      body.details || [],
    )
  }

  return res.json()
}

// --------------- Token storage ---------------

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken')
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem('accessToken', tokens.accessToken)
  localStorage.setItem('refreshToken', tokens.refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

export function getStoredUser(): UserPublic | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function saveUser(user: UserPublic): void {
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem('user')
}

// --------------- Auth API ---------------

export async function register(
  login: string,
  email: string,
  password: string,
): Promise<UserPublic> {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ login, email, password }),
  })
}

export async function login(
  loginStr: string,
  password: string,
): Promise<LoginResult> {
  const result = await request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login: loginStr, password }),
  })
  saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken })
  saveUser(result.user)
  return result
}

export async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  const result = await request<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
  saveTokens(result)
  return result
}

export async function getMe(): Promise<UserPublic> {
  const user = await request<UserPublic>('/auth/me')
  saveUser(user)
  return user
}

export function logout(): void {
  clearTokens()
  clearUser()
}

export async function forgotPassword(login: string, email: string): Promise<void> {
  await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ login, email }),
  })
}

export async function verifyResetToken(token: string): Promise<{ valid: boolean; login: string }> {
  return request(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
}

export async function resetPassword(token: string, password: string): Promise<AuthTokens & { user: UserPublic }> {
  const result = await request<AuthTokens & { user: UserPublic }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
  saveTokens(result)
  saveUser(result.user)
  return result
}

export interface ApiCategory {
  id: number
  name: string
  icon: string
  topics: ApiTopic[]
}

export interface ApiTopic {
  id: number
  name: string
  question_count: number
}

export interface ApiQuestion {
  id: number
  text: string
  image_url: string | null
  answers: string[]
  correctIndex: number
  explanation: string | null
  note: string | null
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  return request('/topics')
}

export async function fetchQuestions(topicIds: number[], count?: number, hideAnswer?: boolean): Promise<ApiQuestion[]> {
  const params = new URLSearchParams()
  params.set('topicIds', topicIds.join(','))
  if (count && count > 0) params.set('count', String(count))
  if (hideAnswer) params.set('hideAnswer', 'true')
  return request(`/topics/questions?${params.toString()}`)
}

export async function checkAnswer(questionId: number, answer: string): Promise<{ correct: boolean; correctAnswer: string; explanation: string | null; message: string }> {
  return request('/game/check-answer', {
    method: 'POST',
    body: JSON.stringify({ questionId, answer }),
  })
}
