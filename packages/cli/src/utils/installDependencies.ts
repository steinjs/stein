import { spawnSync } from "node:child_process";
import { detectPackageManager } from "nypm";

export const installDependencies = async (projectDirectory: string): Promise<void> => {
  const packageManager = await detectPackageManager(projectDirectory)
  const command = packageManager?.command ?? "npm";

  spawnSync(command, ['install'], { 
    cwd: projectDirectory,
    stdio: 'ignore'
  });
}
