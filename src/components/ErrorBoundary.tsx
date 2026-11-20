import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected rendering issue occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF7FA] text-[#361C26] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#F1C6D6] rounded-2xl p-8 text-center shadow-sm">
            <p className="font-editorial italic text-2xl text-[#B33B68] mb-2">
              A gentle pause
            </p>
            <h1 className="font-editorial text-3xl font-semibold mb-3">
              Unable to render this view
            </h1>
            <p className="text-sm text-[#72505D] mb-6 leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#D85A8A] text-white text-sm font-medium hover:bg-[#B33B68] transition-colors"
            >
              Reload Atelier
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
