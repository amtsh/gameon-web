export function formatGamesHosted(count: number): string {
  return count === 1 ? "1 game hosted" : `${count} games hosted`;
}

export function formatGamesPlayed(count: number): string {
  return count === 1 ? "1 game played" : `${count} games played`;
}
