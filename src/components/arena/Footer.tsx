import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#071426] border-t border-white/5 py-12">
      <Container>
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <Link to="/" className="mb-6 md:mb-0">
            <span className="text-3xl font-black text-white tracking-tighter uppercase block">
              OLYMPIA <span className="text-[#D9A441]">2K26</span>
            </span>
          </Link>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/live" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Live</Link>
            <Link to="/matches" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Matches</Link>
            <Link to="/sports" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Sports</Link>
            <Link to="/leaderboard" className="text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">Leaderboard</Link>
          </div>
        </div>
        
        <div className="text-center md:text-left flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/10">
          <p className="text-xs text-white/30 font-bold uppercase tracking-widest mb-4 md:mb-0">
            © {new Date().getFullYear()} Olympia Digital Arena
          </p>
          <p className="text-xs text-[#D9A441] font-bold uppercase tracking-widest">
            Built for Glory
          </p>
        </div>
      </Container>
    </footer>
  );
};
