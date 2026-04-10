import { scaffoldStarter } from "create-demohunter";

export type InitCommandOptions = {
  force?: boolean;
};

export async function initCommand(cwd: string, options: InitCommandOptions = {}): Promise<void> {
  const result = await scaffoldStarter(cwd, options);

  for (const createdFile of result.createdFiles) {
    console.log(createdFile);
  }
}
