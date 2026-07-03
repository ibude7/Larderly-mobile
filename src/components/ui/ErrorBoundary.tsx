import { Component, ReactNode } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Button from './Button';
import { Icon } from './Icon';
import { colors } from '../../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[Larderly] ErrorBoundary caught:', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6 py-10">
        <View className="w-full max-w-md rounded-card border border-line bg-surface p-8">
          <View className="mb-5 h-16 w-16 items-center justify-center self-center rounded-3xl bg-danger/10">
            <Icon name="warning" size={32} color={colors.danger} />
          </View>
          <Text className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-danger">
            Something went wrong
          </Text>
          <Text className="text-center text-xl font-bold text-ink">
            Larderly hit an unexpected error
          </Text>
          <Text className="mt-2 text-center text-sm text-muted">
            The issue has been logged. Try again to continue.
          </Text>
          {error.message ? (
            <ScrollView className="mt-5 max-h-40 rounded-2xl border border-line bg-canvas p-3">
              <Text className="font-mono text-xs text-ink/70">{error.message}</Text>
            </ScrollView>
          ) : null}
          <View className="mt-6">
            <Button label="Try again" icon="refresh" onPress={this.reset} full />
          </View>
        </View>
      </View>
    );
  }
}
