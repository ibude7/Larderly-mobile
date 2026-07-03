import { useState } from 'react';
import { View, Text, Pressable, Modal as RNModal, Platform } from 'react-native';
import Button from './Button';
import TextField from './TextField';
import { Icon } from './Icon';
import { colors } from '../../theme';

interface VoiceInputButtonProps {
  label?: string;
  onTranscript: (text: string) => void | Promise<void>;
  disabled?: boolean;
}

/**
 * Voice input for React Native. Uses a transcript modal (users can type or paste).
 * On web builds with SpeechRecognition, we could extend this — for native parity
 * the AI parser receives the same transcript string larde sends to Gemini.
 */
export default function VoiceInputButton({ label = 'Voice', onTranscript, disabled }: VoiceInputButtonProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    try {
      await onTranscript(t);
      setText('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        className="flex-row items-center justify-center gap-2 rounded-2xl border border-info/30 bg-info/10 px-4 py-3"
      >
        <Icon name="mic" size={18} color={colors.info} />
        <Text className="text-sm font-bold text-info">{label}</Text>
      </Pressable>
      <RNModal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="rounded-t-3xl bg-surface p-6">
            <Text className="mb-1 text-lg font-bold text-ink">Voice command</Text>
            <Text className="mb-4 text-sm text-muted">
              Say or type what to add, e.g. &quot;2 gallons of milk&quot; or &quot;add bananas&quot;.
            </Text>
            <TextField
              value={text}
              onChangeText={setText}
              placeholder="e.g. add 3 apples"
              autoFocus={Platform.OS !== 'web'}
            />
            <View className="mt-4 flex-row gap-2">
              <Button label="Parse & add" onPress={submit} loading={busy} className="flex-1" />
              <Button label="Cancel" variant="ghost" onPress={() => setOpen(false)} />
            </View>
          </Pressable>
        </Pressable>
      </RNModal>
    </>
  );
}
