import type { Match, MatchEvent } from '@/types';

export interface CommentaryConfig {
  voiceEnabled?: boolean;
}

const shouldUseVoiceFor = (type: string): boolean => {
  const t = (type || '').toLowerCase();
  if (t === 'six') return true;
  if (t === 'four') return true;
  if (t === 'wicket') return true;
  if (t === 'run_out') return true;
  if (t === 'fifty') return true;
  if (t === 'hundred') return true;
  if (t === 'over_completed' || t === 'over_complete') return true;
  if (t === 'innings_completed' || t === 'innings_complete') return true;
  if (t === 'match_complete' || t === 'match_end' || t === 'full_time') return true;
  if (t === 'target_reached') return true;
  if (t === 'milestone') return true;
  return false;
};

export const generateCricketCommentary = (
  event: MatchEvent,
  matchState: Match | null
): { text: string; type: string; voiceEnabled: boolean } | null => {
  const t = (event.type || '').toLowerCase();
  const data = (event.data || {}) as Record<string, unknown>;
  const ls = (matchState?.liveState || {}) as Record<string, unknown>;
  const score = (matchState?.score || {}) as Record<string, unknown>;

  const battingTeam = (ls.battingTeam === 'teamB' || (event.team === 'teamB')) ? matchState?.participantB?.name || 'Team B' : matchState?.participantA?.name || 'Team A';
  const batter = (event.playerName || (data.playerName as string) || (data.batter as string) || 'Batter');
  const bowler = (data.bowler as string) || (ls.currentBowlerName as string) || 'Bowler';
  const eventData = (event.data || {}) as Record<string, unknown>;
  const delta = (eventData.delta as Record<string, unknown>) || {};
  const runs = Number(data.runs ?? delta.runs ?? 0);
  const teamRuns = score.teamA !== undefined ? (ls.battingTeam === 'teamB' ? Number(score.teamB) : Number(score.teamA)) : Number(ls.totalRuns || 0);
  const scoreDetails = (score.details as Record<string, unknown>) || {};
  const wickets = Number(ls.wickets || scoreDetails.wickets || 0);
  const overs = Number(ls.overs || ls.over || 0);
  const balls = Number(ls.ball || 0);

  if (t === 'six' || (t === 'run' && runs === 6)) {
    return {
      text: `SIX! That's gone all the way! ${batter} sends it over the boundary!`,
      type: 'SIX',
      voiceEnabled: true,
    };
  }

  if (t === 'four' || (t === 'run' && runs === 4)) {
    return {
      text: `FOUR! Beautiful timing from ${batter}!`,
      type: 'FOUR',
      voiceEnabled: true,
    };
  }

  if (t === 'wicket') {
    const dismissal = (data.dismissalType as string) || 'wicket';
    if (dismissal === 'run_out') {
      return {
        text: `RUN OUT! Huge mix-up and ${batter} has to walk back!`,
        type: 'RUN OUT',
        voiceEnabled: true,
      };
    }
    return {
      text: `OUT! ${batter} has to walk back. A huge breakthrough!`,
      type: 'WICKET',
      voiceEnabled: true,
    };
  }

  if (t === 'run_out') {
    return {
      text: `RUN OUT! ${batter} is short of his crease!`,
      type: 'RUN OUT',
      voiceEnabled: true,
    };
  }

  if (t === 'wide') {
    return {
      text: `Wide ball. An extra run for ${battingTeam}.`,
      type: 'WIDE',
      voiceEnabled: false,
    };
  }

  if (t === 'no_ball') {
    return {
      text: `No ball! Free hit coming up for ${battingTeam}.`,
      type: 'NO BALL',
      voiceEnabled: false,
    };
  }

  if (t === 'bye' || t === 'leg_bye') {
    return {
      text: `Byes! ${runs || 1} extra run(s) added.`,
      type: t.toUpperCase(),
      voiceEnabled: false,
    };
  }

  if (t === 'dot') {
    return {
      text: `Dot ball from ${bowler}.`,
      type: 'DOT',
      voiceEnabled: false,
    };
  }

  if (t === 'single') {
    return {
      text: `Single. ${batter} picks up 1 run.`,
      type: 'SINGLE',
      voiceEnabled: false,
    };
  }

  if (t === 'double') {
    return {
      text: `Double. ${batter} runs hard for 2.`,
      type: 'DOUBLE',
      voiceEnabled: false,
    };
  }

  if (t === 'triple') {
    return {
      text: `Triple! ${batter} takes 3 runs!`,
      type: 'TRIPLE',
      voiceEnabled: true,
    };
  }

  if (t === 'fifty' || t === '50') {
    return {
      text: `FIFTY! ${batter} brings up his half century!`,
      type: 'FIFTY',
      voiceEnabled: true,
    };
  }

  if (t === 'hundred' || t === '100') {
    return {
      text: `HUNDRED! What a knock from ${batter}!`,
      type: 'HUNDRED',
      voiceEnabled: true,
    };
  }

  if (t === 'over_completed' || t === 'over_complete') {
    return {
      text: `That's the end of the over. ${battingTeam} move to ${teamRuns}/${wickets}.`,
      type: 'OVER COMPLETE',
      voiceEnabled: true,
    };
  }

  if (t === 'innings_completed' || t === 'innings_complete' || t === 'innings_end') {
    return {
      text: `Innings complete. ${battingTeam} finish on ${teamRuns}/${wickets}.`,
      type: 'INNINGS COMPLETE',
      voiceEnabled: true,
    };
  }

  if (t === 'target_reached') {
    return {
      text: `They've done it! ${battingTeam} reach the target and win the match!`,
      type: 'TARGET REACHED',
      voiceEnabled: true,
    };
  }

  if (t === 'match_complete' || t === 'match_end' || t === 'full_time') {
    const result = (ls.resultText as string) || '';
    return {
      text: result || `Match complete. Final score: ${Number(score.teamA || 0)}-${Number(score.teamB || 0)}.`,
      type: 'MATCH COMPLETE',
      voiceEnabled: true,
    };
  }

  return null;
};

export const shouldVoiceCommentary = (type: string): boolean => shouldUseVoiceFor(type);
