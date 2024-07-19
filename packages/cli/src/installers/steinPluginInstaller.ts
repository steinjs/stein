
const availableSteinPlugins = ['unocss', 'tailwindcss'];
const availableToolIntegrations = ['biome', 'eslint', 'prettier'];

export const installSteinPlugin = async (pkgName: string, projectDir: string) => {
    if (!availableSteinPlugins.includes(pkgName)) {
        installToolIntegration(pkgName);
    }

    // Installation logic here, use magicast to add import for plugin at the top and put function into array
}

const installToolIntegration = async (pkgName: string) => {
    if (!availableToolIntegrations.includes(pkgName)) {
        throw new Error(`Tool integration ${pkgName} is not a valid Stein plugin or tool integration.`);
    }

    // Install the tool integration
}
