import { scaffoldStarter } from "./scaffold.js";

export type InitCommandOptions = {
  force?: boolean;
};

export async function initCommand(cwd: string, options: InitCommandOptions = {}): Promise<void> {
  let result: Awaited<ReturnType<typeof scaffoldStarter>>;

  try {
    result = await scaffoldStarter(cwd, options);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Refusing to overwrite existing file")) {
      throw new Error(
        `${error.message}. Use "demohunter init --force" to refresh the starter files, or run init in a fresh project directory.`,
        { cause: error },
      );
    }

    throw error;
  }

  for (const createdFile of result.createdFiles) {
    console.log(createdFile);
  }

  console.log("");
  console.log("Next steps:");
  console.log("  1. Run: demohunter generate demos/sample.tour.ts");
  console.log("  2. (Optional) Run: demohunter add-skill");
}
