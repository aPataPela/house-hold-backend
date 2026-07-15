import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "@/design-system/theme";
import { ThemeIdentityVisualPage } from "./index";

const meta = {
  title: "Features/Theme Personalization",
  component: ThemeIdentityVisualPage,
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeIdentityVisualPage>;

export default meta;

type Story = StoryObj<typeof ThemeIdentityVisualPage>;

function StoryShell() {
  return (
    <ThemeProvider houseThemeId="patagonia">
      <ThemeIdentityVisualPage />
    </ThemeProvider>
  );
}

export const Default: Story = {
  render: () => <StoryShell />,
};

