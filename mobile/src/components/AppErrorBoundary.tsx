import { Component, type ReactNode } from 'react';
import { useI18n } from '../i18n';

type BoundaryProps = {
  children: ReactNode;
  title: string;
  detail: string;
  resetLabel: string;
};

type BoundaryState = { failed: boolean };

class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="app-shell">
          <section className="empty-state" role="alert">
            <h1>{this.props.title}</h1>
            <p>{this.props.detail}</p>
            <button className="primary-button" onClick={() => window.location.reload()}>{this.props.resetLabel}</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <ErrorBoundary title={t('error.title')} detail={t('error.detail')} resetLabel={t('error.restart')}>
      {children}
    </ErrorBoundary>
  );
}
