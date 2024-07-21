const AVAILABLE_TOOLS = ["biome", "eslint", "prettier"];

export const installSteinTool = async (tool: string, projectDir: string) => {
  if (!AVAILABLE_TOOLS.includes(tool)) {
    throw new Error(`Tool ${tool} is not a valid stein plugin`);
  }
};
