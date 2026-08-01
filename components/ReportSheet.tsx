import { Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, HeadlineText } from '@/components/ui';
import { useThemedStyles } from '@/theme';

export function ReportSheet({
  visible,
  onClose,
  onSubmit,
  title,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
  title?: string;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useThemedStyles((t) => ({
    container: { flex: 1, backgroundColor: t.colors.bgCanvas },
    content: { padding: t.spacing.lg },
    title: { marginBottom: t.spacing.lg },
  }));

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onSubmit(reason.trim(), details.trim());
      setReason('');
      setDetails('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <HeadlineText style={styles.title}>{title ?? t('safety.report')}</HeadlineText>
        <Input label="Reason" value={reason} onChangeText={setReason} placeholder="Harassment, spam…" />
        <Input
          label="Details (optional)"
          value={details}
          onChangeText={setDetails}
          multiline
          placeholder="What happened?"
        />
        <Button label={t('safety.report')} onPress={handleSubmit} loading={loading} />
        <Button label={t('common.cancel')} onPress={onClose} variant="secondary" />
      </ScrollView>
    </Modal>
  );
}
