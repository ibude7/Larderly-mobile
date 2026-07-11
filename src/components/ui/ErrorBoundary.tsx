import { Component, ReactNode } from "react";
import { ScrollView } from "react-native";
import { Text, View } from "tamagui";
import Button from "./Button";
import { Icon } from "./Icon";
import { useAppColors } from "../../hooks/useAppColors";
import { crashlytics } from "../../lib/firebase";
import { useScale } from "../../theme/scale";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error;
  onReset: () => void;
}) {
  const c = useAppColors();
  const { height, s, fs } = useScale();

  return (
    <View
      className="flex-1 items-center justify-center bg-canvas dark:bg-canvas-dark"
      style={{ paddingHorizontal: s(24), paddingVertical: s(40) }}
    >
      <View
        className="w-full border border-line bg-surface dark:border-line-dark dark:bg-surface-dark"
        style={{ maxWidth: s(448), borderRadius: s(24), padding: s(32) }}
      >
        <View
          className="items-center justify-center self-center bg-danger/10"
          style={{
            marginBottom: s(20),
            width: s(64),
            height: s(64),
            borderRadius: s(24),
          }}
        >
          <Icon name="warning" size={s(32)} color={c.danger} />
        </View>
        <Text
          className="text-center font-bold uppercase text-danger"
          style={{
            marginBottom: s(8),
            fontSize: fs(12),
            letterSpacing: fs(1.2),
          }}
        >
          Something went wrong
        </Text>
        <Text
          className="text-center font-display text-ink dark:text-ink-dark"
          style={{ fontSize: fs(24) }}
        >
          Larderly hit an unexpected error
        </Text>
        <Text
          className="text-center text-muted dark:text-muted-dark"
          style={{ marginTop: s(8), fontSize: fs(14) }}
        >
          The issue has been logged. Try again to continue.
        </Text>
        {error.message ? (
          <ScrollView
            className="border border-line bg-canvas dark:border-line-dark dark:bg-canvas-dark"
            style={{
              marginTop: s(20),
              maxHeight: height * 0.2,
              borderRadius: s(16),
            }}
            contentContainerStyle={{ padding: s(12) }}
          >
            <Text
              className="font-mono text-ink/70 dark:text-ink-dark"
              style={{ fontSize: fs(12) }}
            >
              {error.message}
            </Text>
          </ScrollView>
        ) : null}
        <View style={{ marginTop: s(24) }}>
          <Button label="Try again" icon="refresh" onPress={onReset} full />
        </View>
      </View>
    </View>
  );
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(
      "[Larderly] ErrorBoundary caught:",
      error,
      info.componentStack,
    );
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
