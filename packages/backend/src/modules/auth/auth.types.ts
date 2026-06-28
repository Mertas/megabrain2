export interface User {
  id: number
  login: string
  email: string
  password: string
  nickname: string
  level: number
  icon: string
  is_admin: number
  created_at: string
  updated_at: string
}

export interface UserPublic {
  id: number
  login: string
  email: string
  nickname: string
  level: number
  icon: string
  is_admin: number
  created_at: string
}

export interface RefreshToken {
  id: number
  user_id: number
  token: string
  expires_at: string
  created_at: string
}

export function toPublic(user: User): UserPublic {
  return {
    id: user.id,
    login: user.login,
    email: user.email,
    nickname: user.nickname,
    level: user.level,
    icon: user.icon,
    is_admin: user.is_admin,
    created_at: user.created_at,
  }
}
