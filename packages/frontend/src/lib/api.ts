const BASE_URL = '/api'

export interface UserPublic {
  id: number
  login: string
  email: string
  nickname: string
  level: number
  icon: string
  is_admin: number
  score: number
  best_survival_score: number
  best_survival_streak: number
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

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  })
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

export async function checkAnswer(questionId: number, answer: string, timeElapsedCs?: number, timeLimitSeconds?: number): Promise<{ correct: boolean; correctAnswer: string; explanation: string | null; message: string }> {
  return request('/game/check-answer', {
    method: 'POST',
    body: JSON.stringify({ questionId, answer, timeElapsedCs, timeLimitSeconds }),
  })
}

// --------------- Game config ---------------

export interface SavedGameConfig {
  subtopicIds: number[]
  timeMode: 'per_question' | 'per_game'
  timeValue: string
  questionCount: string
  onlyNew: boolean
}

export async function fetchGameConfig(): Promise<SavedGameConfig | null> {
  return request('/game/config')
}

export async function saveGameConfig(config: SavedGameConfig): Promise<void> {
  return request('/game/config', {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

// --------------- Admin API ---------------

export interface AdminQuestion {
  id: number
  text: string
  answer_1: string
  answer_2: string
  answer_3: string
  answer_4: string
  correct_index: number
  explanation: string | null
  note: string | null
  image_url: string | null
  flagged: number
  topic_id: number
  topic_name: string
  category_id: number
  category_name: string
}

export interface AdminPageResult<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export interface AdminCategory {
  id: number
  name: string
  icon: string
  sort_order: number
  topics: { id: number; name: string; question_count: number; sort_order: number }[]
}

export interface AdminUser {
  id: number
  login: string
  email: string
  nickname: string
  level: number
  icon: string
  is_admin: number
  created_at: string
}

export interface AdminQuestionFilters {
  page?: number
  limit?: number
  search?: string
  flagged?: boolean
  topicId?: number
  categoryId?: number
  noExplanation?: boolean
}

export async function fetchAdminQuestions(f: AdminQuestionFilters = {}): Promise<AdminPageResult<AdminQuestion>> {
  const params = new URLSearchParams({ page: String(f.page ?? 1), limit: String(f.limit ?? 20) })
  if (f.search) params.set('search', f.search)
  if (f.flagged) params.set('flagged', '1')
  if (f.topicId) params.set('topic_id', String(f.topicId))
  if (f.categoryId) params.set('category_id', String(f.categoryId))
  if (f.noExplanation) params.set('no_explanation', '1')
  return request(`/admin/questions?${params}`)
}

export async function fetchAdminQuestion(id: number): Promise<AdminQuestion> {
  return request(`/admin/questions/${id}`)
}

export async function updateAdminQuestion(id: number, data: Partial<AdminQuestion>): Promise<{ ok: boolean; question: AdminQuestion | null }> {
  return request(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteAdminQuestion(id: number): Promise<void> {
  return request(`/admin/questions/${id}`, { method: 'DELETE' })
}

export async function flagQuestion(id: number): Promise<{ id: number; flagged: number }> {
  return request(`/topics/questions/${id}/flag`, { method: 'POST' })
}

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  return request('/admin/categories')
}

export async function createAdminCategory(name: string, icon?: string): Promise<{ id: number }> {
  return request('/admin/categories', { method: 'POST', body: JSON.stringify({ name, icon }) })
}

export async function updateAdminCategory(id: number, data: { name?: string; icon?: string }): Promise<void> {
  return request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteAdminCategory(id: number): Promise<void> {
  return request(`/admin/categories/${id}`, { method: 'DELETE' })
}

export async function createAdminTopic(categoryId: number, name: string): Promise<{ id: number }> {
  return request('/admin/topics', { method: 'POST', body: JSON.stringify({ category_id: categoryId, name }) })
}

export async function updateAdminTopic(id: number, data: { name?: string; category_id?: number }): Promise<void> {
  return request(`/admin/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function deleteAdminTopic(id: number): Promise<void> {
  return request(`/admin/topics/${id}`, { method: 'DELETE' })
}

export async function fetchAdminUsers(page = 1, search = '', limit = 50): Promise<AdminPageResult<AdminUser>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  return request(`/admin/users?${params}`)
}

export async function updateAdminUser(id: number, data: { is_admin?: number; nickname?: string }): Promise<void> {
  return request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

// --------------- Public API (no auth) ---------------

export interface PublicQuestion {
  question: {
    id: number
    text: string
    imageUrl: string | null
    answers: string[]
    correctIndex: number
    note: string | null
  }
  topic: {
    id: number
    name: string
    categoryName: string
  }
}

export async function fetchPublicQuestion(): Promise<PublicQuestion> {
  return request('/public/random-question')
}

export async function checkPublicAnswer(questionId: number, answer: string): Promise<{ correct: boolean; correctAnswer: string; explanation: string | null; message: string }> {
  return request('/public/check-answer', {
    method: 'POST',
    body: JSON.stringify({ questionId, answer }),
  })
}

// --------------- Users / Profile ---------------

export interface UserProfileData {
  id: number
  login: string
  nickname: string
  level: number
  icon: string
  score: number
  elo: number
  name: string
  location: string
  firstSeen: string
  topics: { name: string; subtopics: string[] }[]
  stats: ProfileStats
}

export interface ProfileStats {
  questionsAuthored: number
  totalGames: number
  totalQuestions: number
  totalCorrect: number
  overallAccuracy: number
  solo: {
    gamesPlayed: number
    totalQuestions: number
    totalCorrect: number
    accuracy: number
    avgScore: number
    totalScore: number
  }
  pvp: {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
  }
  blitz: {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
  }
  survival: {
    gamesPlayed: number
    totalQuestions: number
    totalCorrect: number
    accuracy: number
    avgScore: number
    totalScore: number
    bestScore: number
    bestStreak: number
  }
  gamesByFormat: { format: string; count: number; label: string }[]
  authoredByCategory: { category: string; total: number; topics: { topic: string; count: number }[] }[]
  recent: { id: number; format: string; total: number; correct: number; score: number; date: string }[]
}

export interface UserListItem {
  id: number
  login: string
  nickname: string
  level: number
  icon: string
  elo: number
  authoredCount: number
}

export async function fetchUsers(page = 1, search = ''): Promise<AdminPageResult<UserListItem>> {
  const params = new URLSearchParams({ page: String(page), limit: '30' })
  if (search) params.set('search', search)
  return request(`/users?${params}`)
}

export async function fetchUserProfile(login: string): Promise<UserProfileData> {
  return request(`/users/${encodeURIComponent(login)}`)
}

export async function updateProfile(userId: number, data: { nickname?: string }): Promise<UserProfileData> {
  return request(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(data) })
}

// --------------- Scoring ---------------

export interface GameScoreResult {
  totalAwarded: number
  score: number
  breakdown: { questionId: number; points: number }[]
}

export async function submitGameResult(data: {
  timeMode: 'per_question' | 'per_game'
  timeSeconds: number
  total: number
  correct: number
  questions: { questionId: number; correct: boolean; timeElapsedCs: number }[]
}): Promise<GameScoreResult> {
  return request('/game/submit-result', { method: 'POST', body: JSON.stringify(data) })
}

// --------------- PvP ---------------

export interface PvPRatingEntry {
  rank: number
  userId: number
  login: string
  nickname: string
  icon: string
  rating: number
  wins: number
  losses: number
  draws: number
}

export interface PvPHistoryEntry {
  id: number
  opponent: { login: string; nickname: string }
  won: boolean
  draw: boolean
  yourScore: number
  opponentScore: number
  eloChange: number
  questionCount: number
  date: string
}

export async function fetchPvPRatings(page = 1): Promise<AdminPageResult<PvPRatingEntry>> {
  const params = new URLSearchParams({ page: String(page), limit: '50' })
  return request(`/pvp/ratings?${params}`)
}

export async function fetchPvPHistory(login: string, page = 1): Promise<AdminPageResult<PvPHistoryEntry>> {
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  return request(`/pvp/history/${encodeURIComponent(login)}?${params}`)
}

// --------------- Survival API ---------------

export interface SurvivalConfig {
  initialLives: number
  initialTimeSeconds: number
  minTimeSeconds: number
  timeDecreasePerCorrect: number
  streakMultiplierStep: number
  streakMultiplierMax: number
  easyThreshold: number
  mediumThreshold: number
  extraLifeEvery: number
  maxLives: number
}

export interface SurvivalQuestion {
  id: number
  text: string
  imageUrl: string | null
  answers: string[]
  note: string | null
}

export interface SurvivalStartResult {
  sessionId: string
  question: SurvivalQuestion
  questionNumber: number
  timeLimitSeconds: number
  lives: number
  streak: number
  score: number
  difficulty: string
}

export interface SurvivalAnswerResult {
  gameOver: boolean
  correct: boolean
  correctAnswer: string
  explanation: string | null
  pointsAwarded?: number
  totalScore?: number
  lives?: number
  streak?: number
  streakMultiplier?: number
  extraLifeAwarded?: boolean
  nextQuestion?: SurvivalQuestion
  questionNumber?: number
  timeLimitSeconds?: number
  difficulty?: string
  summary?: SurvivalSummary
}

export interface SurvivalSummary {
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  maxStreak: number
  finalStreak: number
  totalScore: number
  difficultyReached: string
  isNewPersonalBestScore: boolean
  isNewPersonalBestStreak: boolean
  rank: number | null
}

export interface SurvivalLeaderboardEntry {
  rank: number
  userId: number
  nickname: string
  score: number
  maxStreak: number
  totalQuestions: number
  date: string
}

export interface SurvivalLeaderboardResult {
  period: string
  entries: SurvivalLeaderboardEntry[]
  userRank: { rank: number; score: number } | null
}

export async function fetchSurvivalConfig(): Promise<SurvivalConfig> {
  return request('/survival/config')
}

export async function startSurvival(topicIds: number[]): Promise<SurvivalStartResult> {
  return request('/survival/start', {
    method: 'POST',
    body: JSON.stringify({ topicIds }),
  })
}

export async function answerSurvival(data: {
  sessionId: string
  questionId: number
  answer: string
  timeElapsedCs: number
  powerup?: string
}): Promise<SurvivalAnswerResult> {
  return request('/survival/answer', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function finishSurvival(sessionId: string): Promise<{ saved: boolean; summary?: SurvivalSummary; message?: string }> {
  return request('/survival/finish', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export async function fetchSurvivalLeaderboard(period: 'all' | 'weekly' | 'daily' = 'all', limit = 50): Promise<SurvivalLeaderboardResult> {
  const params = new URLSearchParams({ period, limit: String(limit) })
  return request(`/survival/leaderboard?${params}`)
}

// --------------- Blitz API ---------------

export interface BlitzRatingEntry {
  rank: number
  userId: number
  login: string
  nickname: string
  icon: string
  rating: number
  wins: number
  losses: number
  draws: number
}

export interface BlitzHistoryEntry {
  id: number
  opponent: { login: string; nickname: string }
  won: boolean
  draw: boolean
  yourScore: number
  opponentScore: number
  eloChange: number
  roundCount: number
  date: string
}

export async function fetchBlitzRatings(page = 1): Promise<AdminPageResult<BlitzRatingEntry>> {
  const params = new URLSearchParams({ page: String(page), limit: '50' })
  return request(`/blitz/ratings?${params}`)
}

export async function fetchBlitzHistory(login: string, page = 1): Promise<AdminPageResult<BlitzHistoryEntry>> {
  const params = new URLSearchParams({ page: String(page), limit: '20' })
  return request(`/blitz/history/${encodeURIComponent(login)}?${params}`)
}

// --------------- Power-ups API ---------------

export interface PowerupType {
  id: string
  name: string
  description: string
  category: string
  cost: number
  max_per_game: number
  available_in: string
  icon: string
}

export interface UserPowerup {
  powerupId: string
  quantity: number
}

export interface PowerupInventoryResult {
  inventory: UserPowerup[]
  score: number
}

export async function fetchPowerupTypes(): Promise<PowerupType[]> {
  return request('/powerups/types')
}

export async function fetchPowerupInventory(): Promise<PowerupInventoryResult> {
  return request('/powerups/inventory')
}

export async function buyPowerup(powerupId: string, quantity = 1): Promise<{ ok: boolean; newScore?: number }> {
  return request('/powerups/buy', {
    method: 'POST',
    body: JSON.stringify({ powerupId, quantity }),
  })
}

export async function usePowerup(powerupId: string, gameMode: string, gameId?: number): Promise<{ ok: boolean; effect: { type: string; name: string; icon: string } }> {
  return request('/powerups/use', {
    method: 'POST',
    body: JSON.stringify({ powerupId, gameMode, gameId }),
  })
}
