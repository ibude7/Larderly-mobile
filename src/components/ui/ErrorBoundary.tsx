import { Component, ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Button from './Button';
import { Icon } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { crashlytics } from '../../lib/firebase';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const c = useAppColors();

  return (
    <View className="flex-1 items-center justify-center bg-canvas dark:bg-[#090A0D] px-6 py-10">
      <View className="w-full max-w-md rounded-card border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] p-8">
        <View className="mb-5 h-16 w-16 items-center justify-center self-center rounded-3xl bg-danger/10">
          <Icon name="warning" size={32} color={c.danger} />
        </View>
        <Text className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-danger">
          Something went wrong
        </Text>
        <Text className="text-center text-xl font-bold text-ink dark:text-[#F6F1EA]">
          Larderly hit an unexpected error
        </Text>
        <Text className="mt-2 text-center text-sm text-muted dark:text-[#9A948D]">
          The issue has been logged. Try again to continue.
        </Text>
        {error.message ? (
          <ScrollView className="mt-5 max-h-40 rounded-2xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] p-3">
            <Text className="font-mono text-xs text-ink/70 dark:text-[#F6F1EA]">{error.message}</Text>
          </ScrollView>
        ) : null}
        <View className="mt-6">
          <Button label="Try again" icon="refresh" onPress={onReset} full />
        </View>
      </View>
    </View>
  );
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[Larderly] ErrorBoundary caught:', error, info.componentStack);
    crashlytics().recordError(error);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return <ErrorFallback error={error} onReset={this.reset} />;
  }
}
