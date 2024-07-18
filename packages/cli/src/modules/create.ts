import { downloadTemplate } from "giget";

export const createModule = async (str: any, options: any) => {
    // Logic for creating app
    const bareTemplateLink = "github:stein-js/stein/examples/bare";

    const { source, dir } = await downloadTemplate(bareTemplateLink, {
        force: true,
        dir: ".",
    });
}