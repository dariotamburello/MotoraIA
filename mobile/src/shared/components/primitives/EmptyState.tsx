import { useTheme } from "@/shared/hooks/useTheme";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Stack } from "./Stack";
import { Text } from "./Text";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { spacing } = useTheme();

  return (
    <Stack
      direction="column"
      align="center"
      justify="center"
      gap={3}
      style={{ paddingVertical: spacing[8], paddingHorizontal: spacing[5] }}
    >
      {icon ? <View>{icon}</View> : null}
      <Text variant="title-2" tone="heading" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="muted" align="center">
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing[2] }}>{action}</View> : null}
    </Stack>
  );
}
