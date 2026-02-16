import { spawn } from 'child_process';
import { parseAllDocuments } from 'yaml';

export type CommandResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
};

export class CommandError extends Error {
    public readonly command: string;
    public readonly args: string[];
    public readonly context: string;
    public readonly result: CommandResult;

    constructor(command: string, args: string[], context: string, result: CommandResult, message: string) {
        super(`Failed to ${context}: ${message}`);
        this.command = command;
        this.args = args;
        this.context = context;
        this.result = result;
    }
}

// Use spawn to avoid ENOBFS from large oc output while keeping behavior deterministic.
export const runCommand = async (command: string, args: string[], context: string): Promise<CommandResult> => {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];

        child.stdout.on('data', chunk => {
            stdoutChunks.push(chunk as Buffer);
        });

        child.stderr.on('data', chunk => {
            stderrChunks.push(chunk as Buffer);
        });

        child.on('error', err => {
            const result: CommandResult = {
                stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
                stderr: Buffer.concat(stderrChunks).toString('utf-8'),
                exitCode: -1,
            };
            reject(
                new CommandError(
                    command,
                    args,
                    context,
                    result,
                    `command "${command} ${args.join(' ')}" failed: ${formatError(err)}`,
                ),
            );
        });

        child.on('close', code => {
            const result: CommandResult = {
                stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
                stderr: Buffer.concat(stderrChunks).toString('utf-8'),
                exitCode: code ?? -1,
            };
            if (code !== 0) {
                const stderr = result.stderr.trim();
                const suffix = stderr ? `: ${stderr}` : '';
                reject(
                    new CommandError(
                        command,
                        args,
                        context,
                        result,
                        `command "${command} ${args.join(' ')}" exited with code ${result.exitCode}${suffix}`,
                    ),
                );
                return;
            }
            resolve(result);
        });
    });
};

export const parseYamlDocuments = (yaml: string, context: string): unknown[] => {
    try {
        return parseAllDocuments(yaml)
            .map(doc => doc.toJS())
            .filter(Boolean);
    } catch (err) {
        throw new Error(`Failed to parse ${context}: ${formatError(err)}`);
    }
};

export const formatError = (err: unknown): string => {
    if (err instanceof CommandError) {
        const stderr = err.result.stderr?.trim();
        return stderr ? `${err.message}: ${stderr}` : err.message;
    }
    if (err instanceof Error) {
        const stderr = getErrorOutput(err);
        return stderr ? `${err.message}: ${stderr}` : err.message;
    }
    return String(err);
};

const getErrorOutput = (err: Error): string | undefined => {
    const errorWithOutput = err as Error & { stderr?: unknown };
    if (!errorWithOutput.stderr) return undefined;
    if (typeof errorWithOutput.stderr === 'string') return errorWithOutput.stderr.trim();
    if (errorWithOutput.stderr instanceof Buffer) return errorWithOutput.stderr.toString('utf-8').trim();
    return String(errorWithOutput.stderr).trim();
};
