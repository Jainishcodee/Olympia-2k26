export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

export function validateReview(review: string): boolean {
  return review.trim().length > 0 && review.length <= 500;
}

export function validateRating(rating: number): boolean {
  return rating >= 1 && rating <= 5;
}

export function validateTeamRoster(roster: string[], captainId: string): boolean {
  return roster.includes(captainId);
}

export function validateMatchConfig(config: any): boolean {
  return config && config.type && config.overs > 0;
}

export function validatePlayerData(data: any): boolean {
  return data && data.name && data.role;
}
