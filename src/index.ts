import type { CSpellReporter, Issue, ReporterConfiguration, RunResult } from '@cspell/cspell-types';
import { HttpProxyAgent } from 'http-proxy-agent';
import "os" 
import "node-fetch"
import * as http from 'http';
import { MessageTypes } from '@cspell/cspell-types';

const API_URL = "http://api.bitbucket.org/2.0/repositories";
const ENV_REPOSITORY_NAME = "BITBUCKET_REPO_FULL_NAME"
const ENV_COMMIT_HASH ="BITBUCKET_COMMIT"

const REPO_NAME = process.env[ENV_REPOSITORY_NAME]
const COMMIT = process.env[ENV_COMMIT_HASH]

export function getReporter(
    settings: unknown ,
    cliOptions?: unknown,
): Required<CSpellReporter> {
    const reportData = {}
    const spellingIssues:Issue []= []
    return {
        issue: (issue) => {
            spellingIssues.push(issue)
        },
        result: async (result) => {
            return createCodeInsightsReport(result)
            .then(() => createAnnotations(spellingIssues))
       },
    }
}

async function createCodeInsightsReport(runResult: RunResult) {
    const report :CodeInsightReport = {
        result: runResult.issues > 0 ? "FAILED" : "PASSED",
        data: [],
        report_type: "BUG",
        title: "CSPell report",
        details: runResult.issues == 0 ? "No spelling issues found" : `${runResult.issues} spelling issues found`,
        external_id: null
    }
    console.log(runResult)
    const headers = new Headers({
            "Content-Type": "application/json",
            "Accept": "application/json"
    })
    const url = `${API_URL}/${REPO_NAME}/commit/${COMMIT}/reports/cspell`
    const agent = new HttpProxyAgent('http://localhost:29418' )
    http.request({
        
    
    })
}

async function createAnnotations(spellingIssues: Issue[]) {
        
}

function push<T>(src: T[] | undefined, value: T): T[] {
    if (src) {
        src.push(value);
        return src;
    }
    return [value];
}

interface CodeInsightAnnotation {
    path: string
    line: number
    message: string
    severity: "LOW" | "MEDIUM" | "HIGH"
    type: "VULNERABILITY" | "CODE_SMELL" | "BUG"
    details: string
    external_id: string | null
}

interface CodeInsightReport {
    title:string
    details:string
    external_id:string | null
    report_type: "SECURITY" | "COVERAGE" | "TEST" | "BUG" | "UNKNOWN"
    result: "FAILED" | "PASSED" | "PENDING" | "UNKNOWN"
    data: any[]
}