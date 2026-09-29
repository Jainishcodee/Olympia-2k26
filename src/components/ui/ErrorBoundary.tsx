import React, { Component, ErrorInfo } from 'react';
import { Button } from './Button';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Olympia Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080A0D] flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-6xl font-black text-[#FF4D3D] mb-4 tracking-tighter">ARENA FAULT</h1>
          <p className="text-white/70 mb-8 max-w-md">The digital arena encountered an unexpected distortion. Our tech team is re-establishing the connection.</p>
          <Button onClick={() => window.location.reload()} variant="primary">REBOOT ARENA</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
