import { startDevelopmentServer } from "@steinjs/core";

export const devModule = async (str: any, options: any) => {
    await startDevelopmentServer(process.cwd());
    // Do some funky stuff in here
}