# Plugging in your AI APIs

Dreamline never calls AI vendors from the browser. All keys stay server-side.

## Interfaces

```ts
// src/lib/ai/providers/types.ts
interface TranscriptionProvider {
  transcribe(audio: File | Blob): Promise<string>;
}

interface DreamAnalysisProvider {
  analyze(transcript: string): Promise<DreamAnalysis>;
  cleanupTranscript(rawTranscript: string): Promise<string>;
}

interface DreamImageProvider {
  generateDreamImage(input: {
    prompt: string;
    referenceImages?: string[];
    style?: DreamVisualStyle;
  }): Promise<GeneratedDreamImage>;
}
```

## Where to swap mocks → real providers

Edit **`src/lib/ai/providers/index.ts`**:

```ts
export function getTranscriptionProvider(): TranscriptionProvider {
  if (process.env.AI_TRANSCRIPTION_API_KEY) {
    return new YourWhisperProvider(process.env.AI_TRANSCRIPTION_API_KEY);
  }
  return new MockTranscriptionProvider();
}

export function getDreamAnalysisProvider(): DreamAnalysisProvider {
  if (process.env.AI_API_KEY) {
    return new YourLLMProvider(process.env.AI_API_KEY);
  }
  return new MockDreamAnalysisProvider();
}

export function getDreamImageProvider(): DreamImageProvider {
  if (process.env.AI_IMAGE_API_KEY) {
    return new YourImageProvider(process.env.AI_IMAGE_API_KEY);
  }
  return new MockDreamImageProvider();
}
```

Recommended file layout for real providers:

```text
src/lib/ai/providers/
  mock.ts
  mock-image.ts
  openai-transcription.ts   ← add
  openai-analysis.ts        ← add
  fal-image.ts              ← add
  index.ts                  ← factory
```

## System prompts

Ready-to-use prompts live in `src/lib/ai/prompts/index.ts`:

- `TRANSCRIPT_CLEANUP_SYSTEM_PROMPT`
- `DREAM_ANALYSIS_SYSTEM_PROMPT`
- `IMAGE_PROMPT_SYSTEM_PROMPT`

Analysis responses are validated with Zod (`dreamAnalysisSchema`) before save.

## Environment variables

| Variable | Used for |
|---|---|
| `AI_TRANSCRIPTION_API_KEY` | Speech → text |
| `AI_API_KEY` | Transcript cleanup + structured dream analysis |
| `AI_IMAGE_API_KEY` | Dream image generation |

## API routes that call providers

| Route | Service |
|---|---|
| `POST /api/dreams/transcribe` | `serviceTranscribe` |
| `POST /api/dreams/analyze` | `serviceAnalyze` |
| `POST /api/dreams/generate-image` | `serviceGenerateDreamImage` |

Orchestration lives in `src/server/dreams/service.ts` — keep React components free of AI logic.

## Reference images

When a person is marked `isRealPerson: true`, the UI prompts for an optional photo. Uploaded URLs are passed as `referenceImages` into `DreamImageProvider.generateDreamImage`. If your image API supports identity / IP-adapter / reference images, map them there. If not, ignore the array until the vendor supports it.

## Demo behavior

Until keys are set, mocks:

1. Transcribe any audio into the childhood-neighborhood sample dream
2. Detect “my ex” as a real person
3. Trigger the reference-photo step
4. Return cinematic SVG placeholders as generated images
