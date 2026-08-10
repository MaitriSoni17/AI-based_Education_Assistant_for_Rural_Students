import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-sm text-amber-900 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 font-bold text-lg text-amber-800">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
            <span>{this.props.fallbackTitle || 'Component Notice'}</span>
          </div>
          <p className="text-xs text-amber-800/90 leading-relaxed font-sans">
            A temporary issue occurred while rendering this section. You can safely try reloading this view without losing your application state.
          </p>
          {this.state.error?.message && (
            <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-xl font-mono text-[11px] text-amber-900 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          <div className="pt-1">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reload Section</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
