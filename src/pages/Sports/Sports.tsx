import React from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';
import { useCollection } from '@/hooks/useCollection';
import { useTheme } from '@/contexts/ThemeContext';
import { Sport } from '@/types';
import { SportsUniverse } from '@/components/arena/SportsUniverse';
import { PageLoading, ErrorNotice, EmptyNotice } from '@/components/admin/kit';
import { cn } from '@/utils/cn';

const Sports: React.FC = () => {
  const { theme } = useTheme();
  const isDay = theme === 'day';
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });

  if (sports.isLoading) {
    return (
      <div
        className={cn(
          'min-h-screen pt-32 flex flex-col items-center justify-center',
          isDay ? 'bg-[#F7F6F1] text-slate-900' : 'bg-[#080A0D] text-white',
        )}
      >
        <PageLoading label="Loading sports…" />
      </div>
    );
  }

  if (sports.error) {
    return (
      <div
        className={cn(
          'min-h-screen pt-32 flex flex-col items-center justify-center px-4',
          isDay ? 'bg-[#F7F6F1] text-slate-900' : 'bg-[#080A0D] text-white',
        )}
      >
        <ErrorNotice message={sports.error} />
      </div>
    );
  }

  if (!sports.data.length) {
    return (
      <div
        className={cn(
          'min-h-screen pt-32 flex flex-col items-center justify-center px-4',
          isDay ? 'bg-[#F7F6F1] text-slate-900' : 'bg-[#080A0D] text-white',
        )}
      >
        <EmptyNotice
          title="No Sports Yet"
          message="Sports will appear here once they're created in the admin panel."
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen pt-28 sm:pt-32 flex flex-col transition-colors duration-300',
        isDay ? 'bg-[#F7F6F1] text-[#071426]' : 'bg-[#080A0D] text-white',
      )}
    >
      <div className="flex-1">
        <SportsUniverse sports={sports.data} />
      </div>
      <Footer />
    </div>
  );
};

export default Sports;
