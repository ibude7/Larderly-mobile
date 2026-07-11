import { ReactNode } from "react";
import { Text, View } from "tamagui";
import Modal from "./Modal";
import Button from "./Button";
import { Icon, IconName } from "./Icon";
import { useAppColors } from "../../hooks/useAppColors";
import type { AppColors } from "../../theme";
import { useScale } from "../../theme/scale";

export type ConfirmTone = "danger" | "warning" | "info";

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

function toneStyles(
  c: AppColors,
): Record<ConfirmTone, { icon: IconName; color: string; badge: string }> {
  return {
    danger: { icon: "warning", color: c.danger, badge: "bg-danger/10" },
    warning: { icon: "warning", color: c.warning, badge: "bg-warning/10" },
    info: { icon: "info", color: c.info, badge: "bg-info/10" },
  };
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
  busy = false,
}: ConfirmDialogProps) {
  const c = useAppColors();
  const { s, fs } = useScale();
  const t = toneStyles(c)[tone];

  return (
    <Modal
      isOpen={isOpen}
      onClose={busy ? () => {} : onClose}
      title={title}
      scroll={false}
      dismissable={!busy}
    >
      <View style={{ padding: s(24) }}>
        <View
          style={{ flexDirection: "row", alignItems: "flex-start", gap: s(14) }}
        >
          <View
            className={`items-center justify-center ${t.badge}`}
            style={{ width: s(48), height: s(48), borderRadius: s(16) }}
          >
            <Icon name={t.icon} size={s(24)} color={t.color} />
          </View>
          <View className="flex-1">
            {typeof description === "string" ? (
              <Text
                className="text-ink/70 dark:text-ink-dark"
                style={{ fontSize: fs(14) }}
              >
                {description}
              </Text>
            ) : (
              description
            )}
          </View>
        </View>
        <View
          style={{
            marginTop: s(24),
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: s(8),
          }}
        >
          <Button
            label={cancelLabel}
            onPress={onClose}
            variant="secondary"
            disabled={busy}
          />
          <Button
            label={confirmLabel}
            onPress={onConfirm}
            variant={tone === "info" ? "primary" : "danger"}
            loading={busy}
          />
        </View>
      </View>
    </Modal>
  );
}
