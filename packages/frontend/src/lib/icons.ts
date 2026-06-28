const PIECES = ['\u2659', '\u2658', '\u2657', '\u2656', '\u2655', '\u2654', '\u265F', '\u265E', '\u265D', '\u265C', '\u265B', '\u265A']

export function getLevelIcon(): string {
  // Return default
  return PIECES[0]
}

export function getEloIcon(elo: number): string {
  if (elo < 1100) return PIECES[0]  // ♙
  if (elo < 1200) return PIECES[1]  // ♘
  if (elo < 1300) return PIECES[2]  // ♗
  if (elo < 1400) return PIECES[3]  // ♖
  if (elo < 1500) return PIECES[4]  // ♕
  if (elo < 1600) return PIECES[5]  // ♔
  if (elo < 1700) return PIECES[6]  // ♟
  if (elo < 1800) return PIECES[7]  // ♞
  if (elo < 1900) return PIECES[8]  // ♝
  if (elo < 2000) return PIECES[9]  // ♜
  if (elo < 2100) return PIECES[10] // ♛
  return PIECES[11]                  // ♚
}
