import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { PantryItem } from '../../types';
import {
  getSuggestedChatPrompts,
  sendChatMessage,
  type ChatMessage,
} from '../../lib/mealAI';
import { useAppColors } from '../../hooks/useAppColors';

interface AIChatModalProps {
  pantryItems: PantryItem[];
  onClose: () => void;
}

export default function AIChatModal({ pantryItems, onClose }: AIChatModalProps) {
  const c = useAppColors();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<ScrollView | null>(null);
  const streamingRef = useRef('');

  const suggestions = useMemo(() => getSuggestedChatPrompts(pantryItems), [pantryItems]);
  const isStreaming = streamingText !== null;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: hasMessages });
  }, [messages, streamingText, hasMessages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleSend = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || isStreaming) return;

      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const userMsg: ChatMessage = { role: 'user', text, ts: Date.now() };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput('');
      setError(null);
      streamingRef.current = '';
      setStreamingText('');

      try {
        const final = await sendChatMessage(pantryItems, messages, text, {
          signal: ctrl.signal,
          onPartial: (partial) => {
            if (ctrl.signal.aborted) return;
            streamingRef.current = partial;
            setStreamingText(partial);
          },
        });
        if (ctrl.signal.aborted) return;
        setMessages([...nextHistory, { role: 'assistant', text: final, ts: Date.now() }]);
        streamingRef.current = '';
        setStreamingText(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          const partial = streamingRef.current.trim();
          if (partial) {
            setMessages((prev) => [
              ...prev,
              { role: 'assistant', text: partial, ts: Date.now() },
            ]);
          }
          streamingRef.current = '';
          setStreamingText(null);
          return;
        }
        setError(err instanceof Error ? err.message : 'Something went wrong.');
        streamingRef.current = '';
        setStreamingText(null);
        setMessages((prev) => prev.slice(0, -1));
      }
    },
    [input, isStreaming, messages, pantryItems],
  );

  const handleStop = () => abortRef.current?.abort();

  const handleReset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingText(null);
    setError(null);
    setInput('');
  };

  return (
    <Modal isOpen onClose={onClose} title="Chat with your chef" scroll={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        style={{ minHeight: 480 }}
      >
        <View className="border-b border-primary/20 bg-primary/5 px-5 py-4">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
              <Icon name="chef" size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Icon name="sparkles" size={13} color={c.primary} />
                <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">
                  AI chef
                </Text>
              </View>
              <Text className="text-sm font-bold text-ink dark:text-[#F6F1EA]">Ask about cooking or your pantry</Text>
              <Text className="text-xs text-muted dark:text-[#9A948D]">
                {pantryItems.length} pantry items in context
              </Text>
            </View>
            {hasMessages ? (
              <Pressable
                onPress={handleReset}
                className="flex-row items-center gap-1.5 rounded-xl border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] px-3 py-2"
              >
                <Icon name="refresh" size={14} color={c.muted} />
                <Text className="text-xs font-bold text-muted dark:text-[#9A948D]">New</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          ref={listRef}
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {!hasMessages && !isStreaming ? (
            <EmptyChat
              pantryCount={pantryItems.length}
              suggestions={suggestions}
              onPick={(s) => void handleSend(s)}
            />
          ) : (
            <View className="gap-4">
              {messages.map((msg) => (
                <MessageBubble key={msg.ts} message={msg} />
              ))}
              {isStreaming ? (
                <MessageBubble
                  message={{ role: 'assistant', text: streamingText ?? '', ts: -1 }}
                  streaming
                />
              ) : null}
            </View>
          )}

          {error ? (
            <View className="mt-4 flex-row items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-3">
              <Icon name="warning" size={16} color={c.danger} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-ink dark:text-[#F6F1EA]">Couldn't reach the chef.</Text>
                <Text className="mt-0.5 text-sm text-ink/70 dark:text-[#F6F1EA]">{error}</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] px-4 py-3">
          <View className="flex-row items-end gap-2">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={
                pantryItems.length
                  ? 'Ask for a recipe, a plan, or a kitchen tip…'
                  : 'Your pantry is empty — ask what to shop for…'
              }
              placeholderTextColor={c.muted}
              multiline
              editable={!isStreaming}
              className="max-h-32 flex-1 rounded-2xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] px-4 py-3 text-sm text-ink dark:text-[#F6F1EA]"
              style={{ maxHeight: 128 }}
              onSubmitEditing={() => void handleSend()}
              blurOnSubmit={false}
            />
            {isStreaming ? (
              <Pressable
                onPress={handleStop}
                className="h-11 w-11 items-center justify-center rounded-2xl border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21]"
              >
                <Icon name="close" size={18} color={c.ink} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => void handleSend()}
                disabled={!input.trim()}
                className={`h-11 w-11 items-center justify-center rounded-2xl bg-primary ${
                  !input.trim() ? 'opacity-40' : ''
                }`}
              >
                <Icon name="send" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
          <Text className="mt-2 text-center text-xs font-semibold text-muted dark:text-[#9A948D]">
            Larderly AI can make mistakes. Double-check ingredients and allergens.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EmptyChat({
  pantryCount,
  suggestions,
  onPick,
}: {
  pantryCount: number;
  suggestions: string[];
  onPick: (prompt: string) => void;
}) {
  const c = useAppColors();
  return (
    <View className="flex-1 items-center justify-center py-6">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-3xl bg-primary">
        <Icon name="sparkles" size={28} color="#FFFFFF" />
      </View>
      <Text className="text-lg font-bold text-ink dark:text-[#F6F1EA]">Let's cook something good.</Text>
      <Text className="mt-2 max-w-sm text-center text-[13px] leading-relaxed text-muted dark:text-[#9A948D]">
        {pantryCount === 0
          ? 'Your pantry is empty, but the chef can still help you plan what to buy and what to make this week.'
          : `The chef can see all ${pantryCount} items in your pantry. Ask for ideas, recipes, substitutions, or a plan.`}
      </Text>
      <View className="mt-5 w-full gap-2">
        {suggestions.map((s) => (
          <Pressable
            key={s}
            onPress={() => onPick(s)}
            className="flex-row items-center gap-2 rounded-2xl border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] px-3.5 py-3"
          >
            <Icon name="sparkles" size={14} color={c.primary} />
            <Text className="flex-1 text-[13px] font-semibold text-ink dark:text-[#F6F1EA]">{s}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MessageBubble({
  message,
  streaming = false,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  const c = useAppColors();
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <View className="items-end">
        <View className="max-w-[85%] rounded-3xl rounded-br-md bg-primary px-4 py-2.5">
          <Text className="text-sm leading-relaxed text-white">{message.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-start gap-2">
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-2xl bg-primary/10">
        <Icon name="chef" size={16} color={c.primary} />
      </View>
      <View className="max-w-[85%] rounded-3xl rounded-tl-md border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] px-4 py-2.5">
        <Text className="text-sm leading-relaxed text-ink dark:text-[#F6F1EA]">{message.text || '…'}</Text>
        {streaming ? (
          <View className="mt-1 h-3.5 w-0.5 animate-pulse bg-primary" />
        ) : null}
      </View>
    </View>
  );
}
