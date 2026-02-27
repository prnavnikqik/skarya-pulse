#!/usr/bin/env tsx
/**
 * scripts/test-prompt.ts
 *
 * Run a fixture through the LLM to test prompt quality.
 * Usage:
 *   npm run test:fixtures -- clean-standup
 *   npm run test:fixtures -- vague-update
 *
 * This is a manual testing tool for Day 0 prompt validation.
 * Run all fixtures before starting development.
 */

import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import * as path from 'path'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const fixtureName = process.argv[2]
if (!fixtureName) {
  console.error('Usage: npm run test:fixtures -- <fixture-name>')
  console.error('Available: clean-standup, vague-update, blocker-with-dependency, new-task-creation, no-update-response')
  process.exit(1)
}

const fixturePath = path.join(__dirname, '../tests/fixtures', `${fixtureName}.json`)
if (!fs.existsSync(fixturePath)) {
  console.error(`Fixture not found: ${fixturePath}`)
  process.exit(1)
}

const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'))

// Build plain-text task context from fixture tasks
function buildTaskContext(tasks: any[]): string {
  return tasks.map(t => {
    let line = `Task ${t.taskNumber} | "${t.name}" | Status: ${t.status} | Priority: ${t.priority || 'Medium'}`
    if (t.subtasks && t.subtasks.length > 0) {
      line += '\n  Subtasks:\n' + t.subtasks.map((s: any) => `    ${s.subtaskNumber} | "${s.name}" | Status: ${s.status}`).join('\n')
    }
    return line
  }).join('\n\n')
}

const taskContext = buildTaskContext(fixture.mockTasks)
const taskReferenceJson = JSON.stringify(fixture.mockTasks.map((t: any) => ({ _id: t._id, taskNumber: t.taskNumber, name: t.name })), null, 2)

const systemPrompt = `You are Kobi, the standup assistant for skarya.ai.

Your job is to run a daily standup for the user. You are professional, warm, and efficient.
Keep each message short. Do not ask multiple questions at once.

## The user's current tasks
${taskContext}

## Standup flow
Run through these topics in order:
1. YESTERDAY — What did they work on yesterday?
2. TODAY — What are they working on today?
3. BLOCKERS — Is anything slowing them down or blocking them?

## Rules you must follow
- Ask ONE topic at a time. Do not combine questions.
- If the user's answer is vague (e.g. "worked on backend stuff"), ask ONE specific follow-up question. Only one. Do not keep asking.
- If the user mentions a task that matches multiple tasks in their list, show them the 2–3 closest matches and ask them to clarify.
- If the user mentions work that doesn't match any task in their list, ask: "I don't see that in your tasks — should I create a new task called '[name]'?"
- If the user mentions being blocked, always ask: what is blocking you, and is it related to another task?
- If the user mentions progress, note it.
- Never invent task names or IDs.
- When all three topics are covered, say exactly: "Great, that covers everything! Let me put together your update."
- Do NOT output JSON during the conversation.

## Tone
Neutral and professional. Not robotic. Not overly cheerful.`

const extractionPrompt = `You are a data extraction assistant. Read the standup conversation below and extract structured information.

Return ONLY valid JSON. No explanation. No markdown. No code fences. Just raw JSON.

The JSON structure must be:
{
  "task_updates": [{ "_id": string, "taskNumber": string, "status": string, "statusCategory": string, "percentageCompletion": number }],
  "progress_comments": [{ "taskId": string, "taskNumber": string, "comment": string }],
  "roadblock_comments": [{ "taskId": string, "taskNumber": string, "comment": string, "notifyLead": boolean }],
  "dependencies_to_add": [{ "taskId": string, "dependsOnTaskId": string }],
  "relations_to_add": [{ "taskId": string, "relatedToTaskId": string, "relationType": string }],
  "new_tasks_to_create": [{ "name": string, "boardId": string, "workspaceId": string, "assigneeEmail": string, "status": "To Do", "priority": string }],
  "new_subtasks_to_create": [],
  "notifications_to_send": [{ "type": string, "taskId": string, "taskName": string, "reason": string }],
  "summary_for_lead": string
}

Use task _id values from the task reference list. Only include items actually discussed.

## Conversation:
${fixture.mockConversation.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

## Task reference list:
${taskReferenceJson}`

async function runTest() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`FIXTURE: ${fixtureName}`)
  console.log(`DESCRIPTION: ${fixture.description}`)
  console.log('='.repeat(60))

  // Step 1: Run conversation (replay the mock conversation)
  console.log('\n📋 MOCK CONVERSATION:')
  fixture.mockConversation.forEach((m: any) => {
    const prefix = m.role === 'assistant' ? '🤖 Kobi:' : '👤 User: '
    console.log(`${prefix} ${m.content}`)
  })

  // Step 2: Run extraction
  console.log('\n🔍 RUNNING EXTRACTION PROMPT...\n')
  const response = await client.messages.create({
    model: 'claude-haiku-3-5-20251001',
    max_tokens: 1500,
    system: 'You are a data extraction assistant. Return only valid JSON.',
    messages: [{ role: 'user', content: extractionPrompt }]
  })

  const rawOutput = response.content[0].type === 'text' ? response.content[0].text : ''

  console.log('📤 RAW LLM OUTPUT:')
  console.log(rawOutput)

  // Step 3: Parse and validate
  try {
    const parsed = JSON.parse(rawOutput)
    console.log('\n✅ JSON PARSE: SUCCESS')
    console.log('\n📊 PARSED OUTPUT:')
    console.log(JSON.stringify(parsed, null, 2))

    // Step 4: Compare with expected
    console.log('\n🎯 EXPECTED OUTPUT:')
    console.log(JSON.stringify(fixture.expectedOutput, null, 2))

  } catch (e) {
    console.log('\n❌ JSON PARSE: FAILED')
    console.log('Error:', e)
    console.log('\n⚠️  The prompt needs to be adjusted. Log this in PROMPT-DESIGN.md.')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📝 Log results in docs/PROMPT-DESIGN.md')
  console.log('='.repeat(60) + '\n')
}

runTest().catch(console.error)
