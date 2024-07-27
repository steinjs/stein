import path from "node:path";
import fs from "node:fs/promises";

export const createFileWithContent = async (
  projectDir: string,
  fileName: string,
  content: string,
) => {
  const filePath = path.join(projectDir, fileName);
  await fs.writeFile(filePath, content);
};
