import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let errorDetails = null;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Firestore Error: ${parsed.error}`;
            errorDetails = parsed;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || "An unexpected error occurred.";
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 15.667c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p className="text-red-600 font-medium mb-6">{errorMessage}</p>
            
            {errorDetails && (
              <div className="text-left bg-gray-50 p-4 rounded-xl mb-6 overflow-auto max-h-40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Error Details</p>
                <pre className="text-[10px] text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(errorDetails, null, 2)}
                </pre>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md"
            >
              Reload Application
            </button>
            <p className="mt-4 text-xs text-gray-500">
              If this persists, please contact support with the error details above.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
