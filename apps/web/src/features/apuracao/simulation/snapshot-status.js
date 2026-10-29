/** Decide o resultado mantendo os votos ainda não apurados como margem. */
export function raceStatus(votes, valid, remaining, seats) {
  if (!(valid > 0)) return 'apurando';
  if (seats === 2) {
    if (votes.length < 3 || votes[1] - votes[2] > remaining) return 'eleitos';
    return votes[0] - votes[2] > remaining ? 'um-eleito' : 'apurando';
  }
  const majority = (valid + remaining) / 2;
  if (votes[0] > majority) return 'eleito';
  if (
    votes[0] + remaining <= majority &&
    (votes.length < 3 || votes[1] - votes[2] > remaining)
  )
    return 'segundo-turno';
  return 'apurando';
}

export function runoffStatus(votes, valid, remaining, complete) {
  return complete || raceStatus(votes, valid, remaining, 1) === 'eleito'
    ? 'eleito'
    : 'apurando';
}

export function presidentialStatus(votes, valid, remaining, progress, round) {
  if (round === 2) return runoffStatus(votes, valid, remaining, progress >= 1);
  if (progress >= 1) return votes[0] > valid / 2 ? 'eleito' : 'segundo-turno';
  return raceStatus(votes, valid, remaining, 1);
}
