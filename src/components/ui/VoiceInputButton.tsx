import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import Button from './Button';
import TextField from './TextField';
import Modal from './Modal';
import { Icon } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface VoiceInputButtonProps {
  label?: string;
  onTranscript: (text: string) => void | Promise<void>;
  disabled?: boolean;
}

export default function VoiceInputButton({
  label = 'Voice',
  onTranscript,
  disabled,
}: VoiceInputButtonProps) {
  const c = useAppColors();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);

  useEffect(() => {
    setSpeechAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
  }, []);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (transcript) setText(transcript);
  });
  useSpeechRecognitionEvent('error', () => setListening(false));

  const stopListening = useCallback(() => {
    if (listening) ExpoSpeechRecognitionModule.stop();
  }, [listening]);

  const startListening = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) return;
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) return;
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  }, []);

  const close = useCallback(() => {
    stopListening();
    setOpen(false);
  }, [stopListening]);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    stopListening();
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
        <Icon name="mic" size={18} color={c.info} />
        <Text className="text-sm font-bold text-info">{label}</Text>
      </Pressable>

      <Modal isOpen={open} onClose={close} title="Voice command" scroll={false}>
        <View className="p-6">
          <Text className="mb-4 text-sm text-muted dark:text-[#6B6878]">
            {speechAvailable
              ? 'Tap the mic and say what to add, e.g. "2 gallons of milk". You can edit the transcript below.'
              : 'Speech recognition is unavailable. Type your command below.'}
          </Text>

          {speechAvailable ? (
            <View className="mb-4 flex-row items-center gap-3">
              <Pressable
                onPress={listening ? stopListening : startListening}
                className="h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: listening ? c.danger : c.primary }}
              >
                <Icon name={listening ? 'close' : 'mic'} size={24} color="#FFFFFF" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-sm font-bold text-ink dark:text-[#F0EEE9]">
                  {listening ? 'Listening…' : 'Tap to speak'}
                </Text>
                <Text className="text-xs text-muted dark:text-[#6B6878]">
                  {listening ? 'Tap again to stop' : 'Uses native speech recognition'}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => Linking.openSettings()}
              className="mb-4 rounded-xl border border-line dark:border-[#2A2A35] px-4 py-3"
            >
              <Text className="text-sm text-muted dark:text-[#6B6878]">
                Enable microphone and speech recognition in Settings to use voice input.
              </Text>
            </Pressable>
          )}

          <TextField
            value={text}
            onChangeText={setText}
            placeholder="e.g. add 3 apples"
            multiline
          />

          <View className="mt-4 flex-row gap-2">
            <Button label="Parse & add" onPress={submit} loading={busy} className="flex-1" />
            <Button label="Cancel" variant="ghost" onPress={close} />
          </View>
        </View>
      </Modal>
    </>
  );
}
