import type { Meta, StoryObj } from "@storybook/react-vite";
import { Home, Plus, RefreshCw, Search, User } from "lucide-react";
import {
  Avatar,
  Badge,
  BottomNavigation,
  Button,
  Card,
  DateField,
  Drawer,
  GlassSurface,
  IconButton,
  Modal,
  Skeleton,
  Select,
  Tabs,
  TextField,
  Toast,
} from "../primitives";
import { StoryFrame, ThemeStory, themeIds } from "./story-helpers";

const meta = {
  title: "Design System/Primitives",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<Record<string, unknown>>;

export default meta;

type Story = StoryObj<Record<string, unknown>>;

export const ButtonDefault: Story = {
  render: () => <Button leadingIcon={<Plus size={16} />}>Primary action</Button>,
};

export const ButtonHover: Story = {
  render: () => <Button hover leadingIcon={<RefreshCw size={16} />}>Hover state</Button>,
};

export const ButtonFocus: Story = {
  render: () => <Button autoFocus leadingIcon={<Search size={16} />}>Focused action</Button>,
};

export const ButtonDisabled: Story = {
  render: () => <Button disabled leadingIcon={<Plus size={16} />}>Disabled</Button>,
};

export const ButtonLoading: Story = {
  render: () => <Button loading leadingIcon={<Plus size={16} />}>Loading action</Button>,
};

export const ButtonLongText: Story = {
  render: () => (
    <Button leadingIcon={<Plus size={16} />}>
      This button label is intentionally long to test wrapping behavior
    </Button>
  ),
};

export const ButtonMobileNarrow: Story = {
  render: () => (
    <StoryFrame narrow>
      <Button leadingIcon={<Plus size={16} />}>Primary action</Button>
      <Button variant="secondary">Secondary action</Button>
    </StoryFrame>
  ),
};

export const ButtonThemes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {themeIds.map((themeId) => (
        <ThemeStory key={themeId} themeId={themeId}>
          <Button leadingIcon={<Home size={16} />}>Theme {themeId}</Button>
        </ThemeStory>
      ))}
    </div>
  ),
};

export const ReducedTransparency: Story = {
  render: () => (
    <ThemeStory themeId="patagonia" reducedTransparency>
      <GlassSurface>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <strong>Glass surface with reduced transparency</strong>
          <span className="ds-field-hint">The blur degrades to an opaque fallback.</span>
        </div>
      </GlassSurface>
    </ThemeStory>
  ),
};

export const IconButtonDefault: Story = {
  render: () => <IconButton icon={<Plus size={18} />} label="Add item" />,
};

export const IconButtonHover: Story = {
  render: () => <IconButton icon={<RefreshCw size={18} />} label="Refresh" hover />,
};

export const IconButtonFocus: Story = {
  render: () => <IconButton icon={<Plus size={18} />} label="Add item" autoFocus />,
};

export const IconButtonDisabled: Story = {
  render: () => <IconButton icon={<Plus size={18} />} label="Add item" disabled />,
};

export const IconButtonLoading: Story = {
  render: () => <IconButton icon={<Plus size={18} />} label="Add item" loading />,
};

export const CardDefault: Story = {
  render: () => (
    <Card>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <strong>Card title</strong>
        <span className="ds-field-hint">A neutral surface for grouping information.</span>
      </div>
    </Card>
  ),
};

export const GlassSurfaceDefault: Story = {
  render: () => (
    <ThemeStory themeId="chiloe">
      <GlassSurface>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <strong>Glass surface</strong>
          <span className="ds-field-hint">Uses blur when available and falls back gracefully.</span>
        </div>
      </GlassSurface>
    </ThemeStory>
  ),
};

export const TextFieldDefault: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" />,
};

export const TextFieldHover: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" />,
};

export const TextFieldFocus: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" autoFocus />,
};

export const TextFieldDisabled: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" disabled />,
};

export const TextFieldLoading: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" loading />,
};

export const TextFieldError: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" error="This field is invalid." />,
};

export const TextFieldSuccess: Story = {
  render: () => <TextField label="Email" placeholder="name@example.com" success="Looks valid." />,
};

export const TextFieldLongText: Story = {
  render: () => (
    <TextField
      label="Long label for edge cases"
      placeholder="This placeholder is intentionally verbose to test truncation and line wrapping"
    />
  ),
};

export const TextFieldMobileNarrow: Story = {
  render: () => (
    <StoryFrame narrow>
      <TextField label="Email" placeholder="name@example.com" />
    </StoryFrame>
  ),
};

export const TextFieldThemes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {themeIds.map((themeId) => (
        <ThemeStory key={themeId} themeId={themeId}>
          <TextField label={`Input in ${themeId}`} placeholder="Tokenized styles only" />
        </ThemeStory>
      ))}
    </div>
  ),
};

export const SelectDefault: Story = {
  render: () => (
    <Select
      label="Theme"
      value="patagonia"
      onChange={() => undefined}
      options={[
        { value: "patagonia", label: "Patagonia" },
        { value: "chiloe", label: "Chiloé" },
        { value: "cordillera", label: "Cordillera" },
      ]}
    />
  ),
};

export const DateFieldDefault: Story = {
  render: () => <DateField label="Date" />,
};

export const TabsDefault: Story = {
  render: () => (
    <Tabs
      value="overview"
      onValueChange={() => undefined}
      tabs={[
        { value: "overview", label: "Overview" },
        { value: "activity", label: "Activity" },
        { value: "history", label: "History" },
      ]}
    >
      <Card style={{ marginTop: "1rem" }}>
        <strong>Tab panel</strong>
      </Card>
    </Tabs>
  ),
};

export const BadgeDefault: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      <Badge>Neutral</Badge>
      <Badge tone="success">Success</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="danger">Danger</Badge>
    </div>
  ),
};

export const AvatarDefault: Story = {
  render: () => <Avatar name="Shared Household" />,
};

export const SkeletonDefault: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: "18rem" }}>
      <Skeleton height={48} />
      <Skeleton width="70%" />
      <Skeleton width="55%" />
    </div>
  ),
};

export const ToastDefault: Story = {
  render: () => (
    <Toast
      tone="success"
      title="Saved"
      description="Your changes were applied successfully."
      action={<Button variant="secondary">Undo</Button>}
    />
  ),
};

export const BottomNavigationDefault: Story = {
  render: () => (
    <BottomNavigation
      value="home"
      items={[
        { value: "home", label: "Home", icon: <Home size={18} /> },
        { value: "expenses", label: "Expenses", icon: <Plus size={18} /> },
        { value: "members", label: "Members", icon: <User size={18} /> },
      ]}
    />
  ),
};

export const ModalDefault: Story = {
  render: () => (
    <Modal
      open
      title="Modal title"
      description="Generic modal with no business logic."
      onClose={() => undefined}
      footer={<Button>Confirm</Button>}
    >
      <p>This modal contains arbitrary content only.</p>
    </Modal>
  ),
};

export const DrawerDefault: Story = {
  render: () => (
    <Drawer
      open
      title="Drawer title"
      description="Generic drawer surface."
      onClose={() => undefined}
      footer={<Button>Confirm</Button>}
    >
      <p>Drawer body content.</p>
    </Drawer>
  ),
};
