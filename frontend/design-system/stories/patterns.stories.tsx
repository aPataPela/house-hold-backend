import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertTriangle, CalendarDays, Home } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  FormField,
  TextField,
} from "../primitives";
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  FilterBar,
  MemberSelector,
  MonthSelector,
  SummaryCard,
} from "../patterns";
import { StoryFrame, ThemeStory, themeIds } from "./story-helpers";

const meta = {
  title: "Design System/Patterns",
  component: SummaryCard,
  tags: ["autodocs"],
} satisfies Meta<Record<string, unknown>>;

export default meta;

type Story = StoryObj<Record<string, unknown>>;

const months = [
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
];

const members = [
  {
    id: "1",
    label: "Ana Pérez",
    description: "Admin",
    badge: <Badge tone="success">Online</Badge>,
  },
  {
    id: "2",
    label: "Diego Soto",
    description: "Member",
  },
  {
    id: "3",
    label: "Camila Rojas",
    description: "Away today",
    badge: <Badge tone="warning">Away</Badge>,
  },
];

export const FormFieldDefault: Story = {
  render: () => (
    <FormField label="Generic field" hint="Helper text under the field.">
      <TextField placeholder="Type here" />
    </FormField>
  ),
};

export const MonthSelectorDefault: Story = {
  render: () => <MonthSelector value="2026-02" months={months} onChange={() => undefined} />,
};

export const MonthSelectorLoading: Story = {
  render: () => <MonthSelector value="2026-02" months={months} onChange={() => undefined} loading />,
};

export const MonthSelectorMobileNarrow: Story = {
  render: () => (
    <StoryFrame narrow>
      <MonthSelector value="2026-02" months={months} onChange={() => undefined} />
    </StoryFrame>
  ),
};

export const MemberSelectorDefault: Story = {
  render: () => (
    <MemberSelector
      value="1"
      members={members}
      onChange={() => undefined}
      hint="Select the active member"
    />
  ),
};

export const MemberSelectorLoading: Story = {
  render: () => (
    <MemberSelector
      value="1"
      members={members}
      onChange={() => undefined}
      loading
      hint="Loading members"
    />
  ),
};

export const FilterBarDefault: Story = {
  render: () => (
    <FilterBar
      value={["active"]}
      onChange={() => undefined}
      items={[
        { value: "active", label: "Active", count: 12 },
        { value: "pending", label: "Pending", count: 4 },
        { value: "closed", label: "Closed", count: 2 },
      ]}
    />
  ),
};

export const SummaryCardDefault: Story = {
  render: () => (
    <SummaryCard
      title="Monthly balance"
      value="$124.50"
      helperText="Compared with the selected month"
      badge={<Badge tone="success">+12%</Badge>}
      icon={<CalendarDays size={20} />}
    />
  ),
};

export const EmptyStateDefault: Story = {
  render: () => (
    <EmptyState
      title="Nothing here yet"
      description="The list is empty. This is a generic state with no product-specific copy."
      action={<Button>Add item</Button>}
      illustration={<Home size={24} />}
    />
  ),
};

export const ErrorStateDefault: Story = {
  render: () => (
    <ErrorState
      title="Something went wrong"
      description="The data could not be loaded."
      action={<Button variant="secondary">Retry</Button>}
      illustration={<AlertTriangle size={24} />}
    />
  ),
};

export const ConfirmationDialogDefault: Story = {
  render: () => (
    <ConfirmationDialog
      open
      title="Confirm action"
      description="This dialog is fully generic."
      onConfirm={() => undefined}
      onCancel={() => undefined}
      confirmLabel="Confirm"
      cancelLabel="Cancel"
    >
      <p>The content here can be any arbitrary message.</p>
    </ConfirmationDialog>
  ),
};

export const ConfirmationDialogDestructive: Story = {
  render: () => (
    <ConfirmationDialog
      open
      title="Delete item"
      description="Destructive variant with danger tone."
      destructive
      onConfirm={() => undefined}
      onCancel={() => undefined}
      confirmLabel="Delete"
    >
      <p>Deletion cannot be undone.</p>
    </ConfirmationDialog>
  ),
};

export const ThemeGallery: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {themeIds.map((themeId) => (
        <ThemeStory key={themeId} themeId={themeId}>
          <Card>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <strong>{themeId}</strong>
              <SummaryCard title="Summary" value="$99.00" helperText="Same UX, different visual identity" />
            </div>
          </Card>
        </ThemeStory>
      ))}
    </div>
  ),
};

export const ReducedTransparency: Story = {
  render: () => (
    <ThemeStory themeId="san-pedro" reducedTransparency>
      <Card>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <strong>Reduced transparency</strong>
          <MonthSelector value="2026-02" months={months} onChange={() => undefined} />
        </div>
      </Card>
    </ThemeStory>
  ),
};
