import { spawn } from "node:child_process";
import { detectPackageManager } from "nypm";

export const installDependencies = async (projectDirectory: string): Promise<void> => {
  const packageManager = await detectPackageManager(projectDirectory)
  let command = packageManager?.command ?? "npm";
  
  return new Promise((resolve, reject) => {
    const child = spawn(command, ['install'], { 
      cwd: projectDirectory,
      stdio: "ignore",
      shell: true
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject();
    });
  });
}
