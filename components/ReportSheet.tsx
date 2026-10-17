import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, HeadlineText } from '@/components/ui';
import { fontFamily, useTheme, useThemedStyles } from '@/theme';

/** Stored as `reports.reason`; the admin queue shows the same labels. */
export const REPORT_REASONS = ['harassment', 'inappropriate', 'spam', 'fake_profile', 'safety', 'underage', 'other'] as const;

export function ReportSheet({
  visible,
  onClose,
  onSubmit,
  title,
  fixedReason,
  intro,
  thanks,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
  title?: string;
  /** Skips the reason chips, e.g. feedback on a roster import. */
  fixedReason?: string;
  intro?: string;
  thanks?: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bgCanvas },
    content: { padding: t.spacing.lg, gap: 14 },
  }));

  const close = () => {
    setReason('');
    setDetails('');
    setError('');
    setSent(false);
    onClose();
  };

  const chosenReason = fixedReason ?? reason;

  const handleSubmit = async () => {
    if (!chosenReason) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(chosenReason, details.trim());
      setSent(true);
    } catch {
      setError(t('report.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <HeadlineText>{title ?? t('safety.report')}</HeadlineText>
        {sent ? (
          <>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary }}>{thanks ?? t('report.thanks')}</Text>
            <Button label={t('common.close')} onPress={close} />
          </>
        ) : (
          <>
            <Text style={{ fontFamily: fontFamily.interRegular, fontSize: 14, lineHeight: 21, color: theme.colors.textSecondary }}>{intro ?? t('report.intro')}</Text>
            {fixedReason ? null : (
              <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {REPORT_REASONS.map((key) => {
                  const selected = reason === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => setReason(key)}
                      style={{
                        paddingHorizontal: 14,
                        height: 38,
                        borderRadius: 19,
                        justifyContent: 'center',
                        backgroundColor: selected ? theme.colors.ink : theme.colors.card,
                        borderWidth: 1.5,
                        borderColor: selected ? theme.colors.ink : theme.colors.track,
                      }}>
                      <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13.5, color: selected ? theme.colors.bgCanvas : theme.colors.textPrimary }}>
                        {t(`report.reasons.${key}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <Input label={t('report.details')} value={details} onChangeText={setDetails} multiline placeholder={t('report.detailsPlaceholder')} />
            {error ? <Text style={{ fontFamily: fontFamily.interMedium, fontSize: 13, color: theme.colors.statusOnDuty }}>{error}</Text> : null}
            <Button label={fixedReason ? t('common.send') : t('safety.report')} onPress={handleSubmit} loading={loading} disabled={!chosenReason} />
            <Button label={t('common.cancel')} onPress={close} variant="secondary" />
          </>
        )}
      </ScrollView>
    </Modal>
  );
}
