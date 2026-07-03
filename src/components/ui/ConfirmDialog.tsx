import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import Modal from './Modal';
import Button from './Button';
import { Icon, IconName } from './Icon';
import { colors } from '../../theme';

export type ConfirmTone = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  busy?: boolean;
}

const TONE: Record<ConfirmTone, { icon: IconName; color: string; badge: string }> = {
  danger: { icon: 'warning', color: colors.danger, badge: 'bg-danger/10' },
  warning: { icon: 'warning', color: colors.warning, badge: 'bg-warning/10' },
  info: { icon: 'info', color: colors.info, badge: 'bg-info/10' },
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onClose,
  busy = false,
}: ConfirmDialogProps) {
  const t = TONE[tone];

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title={title}
      scroll={false}
      dismissable={!busy}
    >
      <View className="p-6">
        <View className="flex-row items-start gap-3.5">
          <View className={`h-12 w-12 items-center justify-center rounded-2xl ${t.badge}`}>
            <Icon name={t.icon} size={24} color={t.color} />
          </View>
          <View className="flex-1">
            {typeof description === 'string' ? (
              <Text className="text-sm leading-relaxed text-ink/70">{description}</Text>
            ) : (
              description
            )}
          </View>
        </View>
        <View className="mt-6 flex-row justify-end gap-2">
          <Button label={cancelLabel} onPress={onClose} variant="secondary" disabled={busy} />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={tone === 'info' ? 'primary' : 'danger'}
            loading={busy}
          />
        </View>
      </View>
    </Modal>
  );
}
