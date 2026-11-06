/** True when DynamoDB rejected a write because its ConditionExpression was not met. */
export const isConditionalCheckFailed = (error: unknown): boolean => {
    const name = (error as { name?: string } | undefined)?.name
    if (name === 'ConditionalCheckFailedException') return true
    // Transactions report each item's failure as a cancellation reason.
    const reasons = (error as { CancellationReasons?: Array<{ Code?: string }> } | undefined)?.CancellationReasons
    return name === 'TransactionCanceledException' &&
        Array.isArray(reasons) && reasons.some(reason => reason?.Code === 'ConditionalCheckFailed')
}
