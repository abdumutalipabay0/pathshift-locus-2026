import { z } from 'zod';
export const defaultAdvisorModel = 'openai/gpt-5.6-luna';
type Message = { role: string; content: string };
/** One bounded repair attempt; errors never become invented answers. */
export async function structuredCompletion<T>({
  model,
  schema,
  messages,
  validate,
  fetcher = fetch,
  signal,
}: {
  model: string;
  schema: z.ZodType;
  messages: Message[];
  validate: (value: unknown) => T;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
}): Promise<T> {
  if (!process.env.CLOSEROUTER_API_KEY) throw new Error('ASSISTANT_UNAVAILABLE');
  const deadline = AbortSignal.timeout(38000);
  for (let attempt = 0; attempt < 2; attempt++) {
    if (signal?.aborted || deadline.aborted) throw new Error('ASSISTANT_UNAVAILABLE');
    try {
      const response = await fetcher('https://api.closerouter.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CLOSEROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.any([
          deadline,
          AbortSignal.timeout(18000),
          ...(signal ? [signal] : []),
        ]),
        body: JSON.stringify({
          model,
          max_tokens: 2400,
          reasoning_effort: 'low',
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'pathshift_response',
              strict: true,
              schema: z.toJSONSchema(schema),
            },
          },
          messages: [
            ...messages,
            ...(attempt
              ? [
                  {
                    role: 'user',
                    content:
                      'The previous response failed validation. Return only a filled JSON object matching the supplied schema. Use only supplied source IDs and programme IDs. Keep it concise, with no admission promises or unsupported probabilities.',
                  },
                ]
              : []),
          ],
        }),
      });
      if (!response.ok) {
        if ([401, 403, 429].includes(response.status)) throw new ProviderTerminalError();
        throw new Error('Provider unavailable');
      }
      const data = await response.json();
      const choice = data?.choices?.[0];
      if (choice?.message?.refusal) throw new ProviderTerminalError();
      if (choice?.finish_reason !== 'stop' || typeof choice?.message?.content !== 'string')
        throw new Error('Invalid response');
      return validate(JSON.parse(choice.message.content));
    } catch (error) {
      if (
        error instanceof ProviderTerminalError ||
        signal?.aborted ||
        deadline.aborted ||
        attempt === 1
      )
        throw new Error('ASSISTANT_UNAVAILABLE');
    }
  }
  throw new Error('ASSISTANT_UNAVAILABLE');
}
class ProviderTerminalError extends Error {}
