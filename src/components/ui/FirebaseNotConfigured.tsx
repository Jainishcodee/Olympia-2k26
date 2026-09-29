import React from 'react';
import { Container } from './Container';

export const FirebaseNotConfigured: React.FC = () => {
  return (
    <Container className="py-12">
      <div className="bg-[#071426] border border-[#1747B8]/30 p-8 text-center max-w-2xl mx-auto">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase">Datastream Offline</h2>
        <p className="text-gray-400 mb-4">
          The Olympia datastream (Firebase) is not currently connected. Live updates, scores, and interactions will be running in simulation mode.
        </p>
        <p className="text-sm text-[#D9A441]">
          System Admins: Configure your environment variables to establish the connection.
        </p>
      </div>
    </Container>
  );
};
