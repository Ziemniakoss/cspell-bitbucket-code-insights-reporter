import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { relative } from "path";

const API_URL = "http://api.bitbucket.org/2.0/repositories";
const BB_PROXY = "http://localhost:29418";

export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    let currentChunk: T[] = [];
    for (const element of array) {
        if (currentChunk.length < size) {
            currentChunk.push(element);
        } else {
            chunks.push(currentChunk);
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }

    return chunks;
}

export async function runCommand(
    command: string,
    args: string[],
): Promise<{ stdOut: string; stdErr: string; code: number }> {
    const process = spawn(command, args);
    let stdOut = "";
    let stdErr = "";
    process.stdout.on("data", (data) => {
        stdOut += data.toString();
    });
    process.stderr.on("data", (data) => {
        stdErr += data.toString();
    });

    return new Promise((resolve, reject) => {
        process.on("exit", (code) => {
            const returnedData = { stdErr, stdOut, code: code ?? 0 };
            if (code == 0) {
                resolve(returnedData);
            } else {
                reject(returnedData);
            }
        });
    });
}

/**
 * @param endpoint endpoint on BB API, like `/repo/slug/report/`
 * @param method HTTP method to be used
 * @param body object to be serialized as JSON
 */
export async function callBitbucketApiCurl(endpoint: string, method: "PUT" | "POST" | "DELETE", body: any) {
    const url = `${API_URL}${endpoint}`;
    return runCommand("curl", [
        "--proxy",
        BB_PROXY,
        "--request",
        method,
        url,
        "--header",
        "Content-Type: application/json",
        "--data-raw",
        JSON.stringify(body),
    ]);
}

export function getRelativePath(fileUri: string, basePath: string = ".") {
    const filePth = fileURLToPath(fileUri);
    return relative(basePath, filePth);
}
