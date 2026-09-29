import React from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Footer } from '@/components/arena/Footer';
import { useCollection } from '@/hooks/useCollection';
import { Sport } from '@/types';
import { SportsUniverse } from '@/components/arena/SportsUniverse';
import { PageLoading, ErrorNotice, EmptyNotice } from '@/components/admin/kit';

const Sports: React.FC = () => {
  const sports = useCollection<Sport>('sports', { sortBy: 'name' });

  if (sports.isLoading) {
    return (
      <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col items-center justify-center">
        <PageLoading label="Loading sports…" />
      </div>
    );
  }

  if (sports.error) {
    return (
      <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col items-center justify-center px-4">
        <ErrorNotice message={sports.error} />
      </div>
    );
  }

  if (!sports.data.length) {
    return (
      <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col items-center justify-center px-4">
        <EmptyNotice
          title="No Sports Yet"
          message="Sports will appear here once they're created in the admin panel."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080A0D] pt-32 text-white flex flex-col">
      <div className="flex-1">
        <SportsUniverse sports={sports.data} />
      </div>
      <Footer />
    </div>
  );
};

export default Sports;
