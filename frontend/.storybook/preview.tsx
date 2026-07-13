import type { Preview } from "@storybook/react-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
  },
};

export default preview;

