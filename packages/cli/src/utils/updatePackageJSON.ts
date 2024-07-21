import fs from "node:fs/promises";
import path from "node:path";

export const updatePackageJSON = async (
  projectDirectory: string,
  hook: (json: any) => Promise<void>,
): Promise<void> => {
  const pathPackageJSON = path.join(projectDirectory, "package.json");
  const packageJSON = JSON.parse(await fs.readFile(pathPackageJSON, "utf-8"));
  await hook(packageJSON);
  await fs.writeFile(pathPackageJSON, JSON.stringify(packageJSON, null, 2));
};
