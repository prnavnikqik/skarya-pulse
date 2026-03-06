import { Message } from 'ai';

export interface ContextConfig {
    historyLimit: number; // Max total messages to keep
    systemPromptTokensEstimate: number; // Approximate token budget overhead
}

/**
 * Validates, truncates, and formats the message array that goes into the LLM.
 * This is Layer 3 (Context Builder), preventing token explosions from long chats
 * or massive tool payloads from 10 turns ago.
 */
export function buildTokenControlledContext(
    allMessages: Message[],
    config: ContextConfig = { historyLimit: 6, systemPromptTokensEstimate: 400 }
) {
    // Always keep the very latest message (usually user), and take the last N items
    // To avoid cutting off an assistant's tool call halfway (which 'ai' strict parsing hates),
    // we could just take the last N where N is safe.

    if (allMessages.length <= config.historyLimit) {
        return allMessages;
    }

    // Safely truncate history
    const trimmed = allMessages.slice(-config.historyLimit);

    // We need to ensure we don't sever the context awkwardly.
    // The safest boundary to start a new truncated conversation is a 'user' message.
    let safeStartIndex = 0;
    for (let i = 0; i < trimmed.length; i++) {
        const msg = trimmed[i];
        if (msg.role === 'user') {
            safeStartIndex = i;
            break;
        }
    }

    return trimmed.slice(safeStartIndex);
}
