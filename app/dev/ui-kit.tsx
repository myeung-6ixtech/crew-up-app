import { ScrollView, View } from 'react-native';
import {
  Screen,
  Title,
  Subtitle,
  Button,
  Card,
  Badge,
  Avatar,
  StatusDot,
  ListRow,
  SectionLabel,
  SelectionOption,
  PillSelectorGroup,
  Input,
  EmptyState,
  DisplayText,
  HeadlineText,
  BodyText,
  LabelText,
  NumericText,
} from '@/components/ui';
import { useTheme } from '@/theme';

export default function UiKitScreen() {
  const theme = useTheme();

  return (
    <Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}>
        <DisplayText style={{ marginBottom: 8 }}>CrewUp UI Kit</DisplayText>
        <Subtitle>Design system reference — documentation/design-system.md</Subtitle>

        <SectionLabel>Typography</SectionLabel>
        <HeadlineText>Headline</HeadlineText>
        <BodyText>Body text for default UI copy.</BodyText>
        <BodyText strong>Body strong</BodyText>
        <LabelText>Eyebrow label</LabelText>
        <NumericText>2026-08-01 · 14:30</NumericText>

        <SectionLabel>Buttons</SectionLabel>
        <Button label="Primary" onPress={() => {}} />
        <Button label="Secondary" onPress={() => {}} variant="secondary" />
        <Button label="Ghost" onPress={() => {}} variant="ghost" />
        <Button label="Destructive" onPress={() => {}} variant="destructive" />

        <SectionLabel>Badges & status</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Badge label="Default" />
          <Badge label="Verified" tone="verified" />
          <Badge label="Status" tone="status" />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <StatusDot status="available" />
          <StatusDot status="onDuty" />
          <StatusDot status="layover" />
          <StatusDot status="verified" />
        </View>

        <SectionLabel>Avatar</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <Avatar name="Alex" size="sm" />
          <Avatar name="Alex" size="md" />
          <Avatar name="Alex" size="lg" />
        </View>

        <SectionLabel>Card</SectionLabel>
        <Card>
          <BodyText strong>Layover card</BodyText>
          <NumericText muted>HKG · 2–4 Aug</NumericText>
        </Card>

        <SectionLabel>List row</SectionLabel>
        <ListRow title="Jamie Chen" subtitle="Cabin crew · HKG" avatarName="Jamie" right={<NumericText>18:40</NumericText>} />

        <SectionLabel>Selection</SectionLabel>
        <SelectionOption label="Selected option" selected onPress={() => {}} />
        <SelectionOption label="Unselected option" selected={false} onPress={() => {}} />

        <SectionLabel>Pill selectors</SectionLabel>
        <PillSelectorGroup
          label="Role"
          options={[
            { value: 'cabin_crew', label: 'cabin crew' },
            { value: 'pilot', label: 'pilot' },
            { value: 'ground_ops', label: 'ground ops' },
          ]}
          value="pilot"
          onChange={() => {}}
        />

        <SectionLabel>Input</SectionLabel>
        <Input label="Sample" value="" onChangeText={() => {}} placeholder="Placeholder" />

        <SectionLabel>Empty state</SectionLabel>
        <EmptyState title="Nothing here yet" body="Upload a roster to get started." />
      </ScrollView>
    </Screen>
  );
}
