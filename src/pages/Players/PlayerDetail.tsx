import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Activity, Shield } from 'lucide-react';
import { cn } from '@/utils/cn';

const usePlayer = (id: string) => ({
  player: {
    id, name: 'John Doe', number: 23, teamName: 'Thunderbolts', teamId: '1', sport: 'Basketball', 
    position: 'Power Forward', role: 'captain', gender: 'Male', bio: 'A veteran player known for his defensive skills and leadership on the court.',
    stats: { matches: 45, points: 670, assists: 120, rebounds: 310 },
    rating: 4.8, ratingCount: 156
  },
  loading: false
});

export const PlayerDetail: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const { player, loading } = usePlayer(playerId || '');

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-navy"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-blue"></div></div>;
  if (!player) return <div className="min-h-screen flex items-center justify-center text-white bg-navy">Player not found</div>;

  return (
    <div className="min-h-screen bg-navy text-white pb-20 pt-24">
      <div className="container mx-auto px-4">
        <Link to="/players" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Players
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
              {player.role === 'captain' && <div className="absolute top-4 right-4 bg-gold/20 text-gold p-2 rounded-xl" title="Captain"><Shield size={20} /></div>}
              {player.role === 'vice-captain' && <div className="absolute top-4 right-4 bg-gray-300/20 text-gray-300 p-2 rounded-xl" title="Vice Captain"><Shield size={20} /></div>}
              
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-electric-blue to-royal-blue flex items-center justify-center text-5xl font-black mb-6 relative">
                {player.name.charAt(0)}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-navy border-4 border-navy rounded-full flex items-center justify-center font-bold bg-white text-navy">
                  {player.number}
                </div>
              </div>
              
              <h1 className="text-3xl font-black mb-2">{player.name}</h1>
              <Link to={`/teams/${player.teamId}`} className="text-electric-blue hover:underline font-medium block mb-6">
                {player.teamName}
              </Link>
              
              <div className="flex items-center justify-center gap-2 text-gold mb-8">
                <Star className="fill-gold" size={24} />
                <span className="text-2xl font-bold">{player.rating.toFixed(1)}</span>
                <span className="text-white/40 text-sm">({player.ratingCount} ratings)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Info & Stats */}
          <div className="md:col-span-2 space-y-8">
            {/* Info Grid */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2"><Activity size={20} className="text-electric-blue"/> Player Info</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <div className="text-white/40 text-sm mb-1">Sport</div>
                  <div className="font-medium">{player.sport}</div>
                </div>
                <div>
                  <div className="text-white/40 text-sm mb-1">Position</div>
                  <div className="font-medium">{player.position}</div>
                </div>
                <div>
                  <div className="text-white/40 text-sm mb-1">Role</div>
                  <div className="font-medium capitalize">{player.role}</div>
                </div>
                <div>
                  <div className="text-white/40 text-sm mb-1">Gender</div>
                  <div className="font-medium">{player.gender}</div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="text-white/40 text-sm mb-2">Bio</div>
                <p className="text-white/80 leading-relaxed">{player.bio}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-xl font-bold uppercase tracking-wider mb-6 text-white">Season Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/30 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-electric-blue mb-1">{player.stats.matches}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Matches</div>
                </div>
                <div className="bg-black/30 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-white mb-1">{player.stats.points}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Points</div>
                </div>
                <div className="bg-black/30 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-white mb-1">{player.stats.assists}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Assists</div>
                </div>
                <div className="bg-black/30 p-4 rounded-xl text-center border border-white/5">
                  <div className="text-3xl font-black text-white mb-1">{player.stats.rebounds}</div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Rebounds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
