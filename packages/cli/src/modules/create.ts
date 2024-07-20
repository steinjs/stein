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
import * as clp from '@clack/prompts';
import color from 'picocolors';

import { downloadTemplate } from "giget";
import { installDependencies } from "nypm";
import { spawn, spawnSync } from "node:child_process";
import { installSteinPlugin } from "../installers/steinPluginInstaller";

export const createModule = async (str: any, options: any) => {
    // Logic for creating app
    const bareTemplateLink = "github:steinjs/stein/examples/bare";

    await setupWizard(bareTemplateLink);
}

const setupWizard = async (templateLink: string) => {
    intro(color.bgMagenta(" stein create "));

    const name = await text({
        message: "What is the name of your project?",
        placeholder: "my-stein-project",
        defaultValue: "my-stein-project",
    });
    if (isCancel(name)) {
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
        const group = await clp.group(
            {
                // maybe generate these programmatically based on the integrations which are available (TODO)
                tools: () =>
                    clp.multiselect({
                        message: `What tools do you want to install? (Note: tools are not available yet)`,
                        options: [
                            { value: 'biome', label: 'Biome', hint: 'recommended'},
                            { value: 'eslint', label: 'ESLint' },
                            { value: 'prettier', label: 'Prettier' }
                        ],
                        required: false 
                    }),
                plugins: () =>
                    clp.multiselect({
                        message: `What plugins do you want to add to your project?`,
                        options: [
                            { value: 'unocss', label: 'UnoCSS' },
                            { value: 'tailwindcss', label: 'TailwindCSS' }
                        ],
                        required: false
                    }),
            },
            {
                onCancel: () => {
                    clp.cancel('Operation cancelled.');
                    process.exit(0);
                },
            }
        );

        if (group.tools && group.tools.length > 0 && Array.isArray(group.tools)) {
            extraPackages.push(...group.tools as string[]);
        }

        if (group.plugins && group.plugins.length > 0 && Array.isArray(group.plugins)) {
            extraPackages.push(...group.plugins as string[]);
        }
    }

    const typeScriptEnabled = await confirm({
        message: "Do you want to use TypeScript?",
    });
    if (isCancel(typeScriptEnabled)) {
        cancel("Operation cancelled");
        return process.exit(0);
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
    if (extraPackages.length > 0) {
        await installProjectIntegrations(projectDir, extraPackages);
    }

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
    try {
        await installDependencies({
            cwd: projectDir,
            silent: true,
        });

        s.stop('Installed dependencies successfully.');
    }
    catch (err) {
        console.error(err);
        s.stop("Failed installing dependencies, skipping...");
    }

}

const initGitRepo = async (projectDir: string) => {
    const s = spinner();
    s.start('Initializing git repository...');

    try {
        spawnSync('git', ['init'], { 
            cwd: projectDir,
            stdio: 'ignore'
        });
        s.stop('Initialized git repository successfully.');
    } catch (error) {
        console.error('Error initializing git repository:', error);
        s.stop("Failed initializing git repository, skipping...");
    }
}

const installProjectIntegrations = async (projectDir: string, extraPackages: string[]) => {
    // Install integrations here
    console.log(extraPackages);

    const s = spinner();
    s.start('Installing integrations...');

    for (const pkg of extraPackages) {
        try {
            await installSteinPlugin(pkg, projectDir);
        }
        catch (err: any) {
            console.error(err);
        }
    }

    s.stop('Installed tools and integrations successfully.');
}