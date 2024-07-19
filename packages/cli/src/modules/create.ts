import { promises as fs } from "node:fs"
import path from "node:path";

import {
    intro,
    outro,
    confirm,
    select,
    spinner,
    isCancel,
    cancel,
    text,
    multiselect,
} from '@clack/prompts';
import color from 'picocolors';

import { downloadTemplate } from "giget";
import { installDependencies } from "nypm";

export const createModule = async (str: any, options: any) => {
    // Logic for creating app
    const bareTemplateLink = "github:stein-js/stein/examples/bare";

    await setupWizard(bareTemplateLink);
}

const setupWizard = async (templateLink: string) => {
    intro(color.bgMagenta(" stein create "));

    const name = await text({
        message: "What is the name of your project?",
        placeholder: "my-stein-project",
    });

    if (isCancel(name)) {
        cancel("Operation cancelled");
        return process.exit(0);
    }

    const typeScriptEnabled = await confirm({
        message: "Do you want to use TypeScript?",
    });

    if (isCancel(typeScriptEnabled)) {
        cancel("Operation cancelled");
        return process.exit(0);
    }

    const projectType = await select({
        message: "Pick a project preset.",
        options: [
            { value: "minimal", label: "Minimal Starter" },
            { value: "custom", label: "Custom" },
            // TODO: add custom presets here here later
        ],
    });

    if (isCancel(projectType)) {
        cancel("Operation cancelled");
        return process.exit(0);
    }

    const extraPackages: string[] = [];
    if (projectType === "custom") {
        const additionalTools = await multiselect({
            message: 'Select the features and tools you want to include in your project.',
            options: [
                { value: 'unocss', label: 'UnoCSS Plugin' },
                { value: 'eslint', label: 'ESLint', hint: 'recommended' },
                { value: 'prettier', label: 'Prettier' },
            ],
            required: false,
        });

        if (isCancel(additionalTools)) {
            cancel("Operation cancelled");
            return process.exit(0);
        }

        if (additionalTools.length > 0 && Array.isArray(additionalTools)) {
            extraPackages.push(...additionalTools as string[]);
        }
    }

    const projectDir = await cloneTemplate(name, templateLink);
    if (typeScriptEnabled) {
        // delete stein.config.js inside the projectDir using the node fs module
        await fs.unlink(path.join(projectDir, 'stein.config.js'));
    }
    else {
        // delete tsconfig.json inside the projectDir using the node fs module
        await fs.unlink(path.join(projectDir, 'tsconfig.json'));
        await fs.unlink(path.join(projectDir, 'stein.config.ts'));
    }

    // go through all integrations if custom or any present is selected and install/configure them
    await installProjectIntegrations(projectDir, extraPackages);

    const shouldInstallDependencies = await confirm({
        message: "Do you want to install dependencies?",
    });

    if (isCancel(shouldInstallDependencies)) {
        cancel('Operation cancelled');
        return process.exit(0);
    }

    if (shouldInstallDependencies) {
        await installProjectDependencies(projectDir);
    }

    const shouldInitGitRepo = await confirm({
        message: "Do you want to init a new Git repository?",
    });

    if (isCancel(shouldInitGitRepo)) {
        cancel('Operation cancelled');
        return process.exit(0);
    }

    if (shouldInitGitRepo) {
        await initGitRepo(projectDir);
    }

    outro(`Stein project ${color.inverse(` ${name} `)} created successfully!`);
}

const cloneTemplate = async (projectName: string, templateLink: string): Promise<string> => {
    const s = spinner();
    s.start("Downloading template...");
    const { dir } = await downloadTemplate(templateLink, {
        force: true,
        dir: projectName,
    });
    s.stop("Successfully downloaded template.");

    return dir;
}

const installProjectDependencies = async (projectDir: string) => {
    const s = spinner();
    s.start('Installing dependencies...');
    
    // Install deps with users package manager (currently silent install, maybe change this)
    await installDependencies({
        cwd: projectDir,
        silent: true,
    });

    s.stop('Installed dependencies successfully.');
}

const initGitRepo = async (projectDir: string) => {
    // Create a new git repo in the project dir
}

const installProjectIntegrations = async (projectDir: string, extraPackages: string[]) => {
    // Install integrations here
    console.log(extraPackages);
}