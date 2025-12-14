import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-destructive/20 rounded-lg my-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
                        <AlertTriangle size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                        组件加载出错
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                        {this.state.error?.message || '发生了一个未知错误，无法显示此内容。'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw size={16} />
                        刷新页面
                    </button>
                    {import.meta.env.DEV && this.state.errorInfo && (
                        <details className="mt-4 text-left w-full max-w-lg overflow-auto bg-muted p-4 rounded text-xs font-mono">
                            <summary className="cursor-pointer mb-2 font-medium">错误堆栈</summary>
                            <pre>{this.state.error?.stack}</pre>
                            <pre>{this.state.errorInfo.componentStack}</pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
