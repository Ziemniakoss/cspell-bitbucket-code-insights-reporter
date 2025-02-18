export interface CodeInsightReport {
    title: string;
    details: string;
    external_id: string | null;
    report_type: "SECURITY" | "COVERAGE" | "TEST" | "BUG" | "UNKNOWN";
    result: "FAILED" | "PASSED" | "PENDING" | "UNKNOWN";
    data: any[];
}
