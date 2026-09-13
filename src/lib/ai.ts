export type AIProvider = "mock" | "openai" | "deepseek" | "huggingface";

/**
 * Provider do zadań na obrazach (generowanie z tekstu, z przykładowego obrazu, analiza obrazu).
 * Obecnie tylko openrouter (model sourceful/riverflow-v2-pro).
 */
export type AIImageProvider = "openrouter";

const CHAT_URL = {
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
  huggingface: "https://router.huggingface.co/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
} as const;

const DEFAULT_MODEL = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  huggingface: "zai-org/GLM-4.5V",
  openrouter: "google/gemini-3.1-flash-image-preview",
} as const;

/** Przy 404 (brak endpointu image+text) aplikacja próbuje te modele po kolei. */
const OPENROUTER_IMAGE_FALLBACK_MODELS = [
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-2.5-flash-image",
  "black-forest-labs/flux.2-pro",
  "sourceful/riverflow-v2-fast-preview",
] as const;

export interface OpenRouterImageConfig {
  aspect_ratio?: string;
  image_size?: "0.5K" | "1K" | "2K" | "4K";
}

export interface GenerateAIImageOptions {
  /** Override model chain (first = primary). Defaults to OPENROUTER_IMAGE_MODEL + fallbacks. */
  models?: string[];
  image_config?: OpenRouterImageConfig;
}

const ENV_HINT = "Ustaw OPENROUTER_API_KEY oraz AI_IMAGE_PROVIDER=openrouter w Railway / .env.local";

/** OpenRouter do obrazów: jawnie openrouter LUB auto gdy jest OPENROUTER_API_KEY. */
function useOpenRouterForImages(): boolean {
  const explicit = (process.env.AI_IMAGE_PROVIDER || "").trim().toLowerCase();
  if (explicit === "openrouter") return true;
  if (explicit && explicit !== "none" && explicit !== "off") return false;
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export interface AIResponse {
  content: string;
  /** Wygenerowane obrazy (base64 data URL) – gdy AI_IMAGE_PROVIDER=openrouter i model zwraca image. */
  images?: string[];
}

type OpenRouterImageError = { status: number; errText: string };

function parseOpenRouterImageResponse(data: {
  choices?: { message?: { content?: string; images?: { image_url?: { url?: string } }[] } }[];
}): AIResponse {
  const message = data.choices?.[0]?.message;
  const images =
    message?.images?.map((img) => img.image_url?.url).filter((u): u is string => Boolean(u)) ?? [];
  return {
    content: message?.content ?? "",
    images: images.length > 0 ? images : undefined,
  };
}

async function openRouterImageRequest(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: unknown }>,
  options?: { image_config?: OpenRouterImageConfig }
): Promise<AIResponse> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.3,
    modalities: ["image", "text"],
  };
  if (options?.image_config) {
    body.image_config = options.image_config;
  }

  const response = await fetch(CHAT_URL.openrouter, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    const err: OpenRouterImageError = { status: response.status, errText };
    throw err;
  }
  const data = (await response.json()) as Parameters<typeof parseOpenRouterImageResponse>[0];
  return parseOpenRouterImageResponse(data);
}

/** Optional: when true, request JSON output (OpenAI/DeepSeek json_object). */
export async function generateAIResponse(
  prompt: string,
  options?: { jsonMode?: boolean }
): Promise<AIResponse> {
  return generateAIResponseInternal(prompt, undefined, options);
}

/**
 * Vision / image: prompt + obraz (base64 data URL).
 * - Gdy AI_IMAGE_PROVIDER=openrouter: OpenRouter + sourceful/riverflow-v2-pro, modalities ["image","text"] → zwraca wygenerowany obraz + ewentualnie tekst.
 * - W przeciwnym razie: OpenAI/DeepSeek (VLM) → zwraca tekst (np. JSON).
 */
export async function generateAIVisionResponse(
  prompt: string,
  imageBase64DataUrl: string,
  options?: { jsonMode?: boolean }
): Promise<AIResponse> {
  return generateAIResponseInternal(prompt, imageBase64DataUrl, options);
}

/**
 * Generowanie obrazu z tekstu (text-to-image) przez OpenRouter (sourceful/riverflow-v2-pro).
 * Wymaga AI_IMAGE_PROVIDER=openrouter oraz OPENROUTER_API_KEY.
 */
export async function generateAIImageFromText(
  prompt: string,
  options?: GenerateAIImageOptions
): Promise<AIResponse> {
  if (!useOpenRouterForImages()) {
    throw new Error(`Generowanie obrazów wymaga OpenRouter. ${ENV_HINT}`);
  }
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(`OPENROUTER_API_KEY jest wymagany dla generowania obrazów. ${ENV_HINT}`);
  }
  const primaryModel = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_MODEL.openrouter;
  const modelsToTry = options?.models?.length
    ? options.models
    : [primaryModel, ...OPENROUTER_IMAGE_FALLBACK_MODELS.filter((m) => m !== primaryModel)];
  const messages = [{ role: "user", content: prompt }];
  let lastErr: OpenRouterImageError | null = null;

  for (const model of modelsToTry) {
    try {
      return await openRouterImageRequest(apiKey, model, messages, {
        image_config: options?.image_config,
      });
    } catch (e) {
      const err = e as OpenRouterImageError;
      lastErr = err;
      if (err.status === 401) {
        console.error(
          "[OpenRouter 401] Klucz API odrzucony. Sprawdź OPENROUTER_API_KEY w .env.local – https://openrouter.ai/settings/keys"
        );
        throw new Error(`OpenRouter (image from text): ${err.status} ${err.errText.slice(0, 300)}`);
      }
      if (err.status === 404 && err.errText.includes("modalities")) {
        if (model !== modelsToTry[0]) {
          console.warn(`[OpenRouter] Fallback ${model} też zwrócił 404, próbuję dalej...`);
        } else {
          console.warn(`[OpenRouter] Model ${model} zwrócił 404 (brak endpointu image+text), próbuję fallback...`);
        }
        continue;
      }
      if (err.status === 429) {
        console.warn(`[OpenRouter] Model ${model} rate-limited (429), próbuję fallback...`);
        continue;
      }
      throw new Error(`OpenRouter (image from text): ${err.status} ${err.errText.slice(0, 300)}`);
    }
  }
  throw new Error(
    `OpenRouter (image from text): żaden model nie zadziałał (404). Ostatni: ${lastErr?.status} ${lastErr?.errText?.slice(0, 200) ?? ""}`
  );
}

async function generateAIResponseInternal(
  prompt: string,
  imageBase64DataUrl: string | undefined,
  options?: { jsonMode?: boolean }
): Promise<AIResponse> {
  const useImageProvider = Boolean(imageBase64DataUrl && useOpenRouterForImages());

  if (useImageProvider) {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error(`OpenRouter wymaga OPENROUTER_API_KEY. ${ENV_HINT}`);
    }
    const primaryModel = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_MODEL.openrouter;
    const modelsToTry = [
      primaryModel,
      ...OPENROUTER_IMAGE_FALLBACK_MODELS.filter((m) => m !== primaryModel),
    ];
    const content: unknown = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: imageBase64DataUrl } },
    ];
    const messages = [{ role: "user", content }];
    let lastErr: OpenRouterImageError | null = null;

    for (const model of modelsToTry) {
      try {
        return await openRouterImageRequest(apiKey, model, messages);
      } catch (e) {
        const err = e as OpenRouterImageError;
        lastErr = err;
        if (err.status === 401) {
          console.error(
            "[OpenRouter 401] Klucz API odrzucony. Sprawdź OPENROUTER_API_KEY w .env.local – https://openrouter.ai/settings/keys"
          );
          throw new Error(`OpenRouter (image): ${err.status} ${err.errText.slice(0, 300)}`);
        }
        if (err.status === 404 && err.errText.includes("modalities")) {
          if (model !== modelsToTry[0]) {
            console.warn(`[OpenRouter] Fallback ${model} też zwrócił 404, próbuję dalej...`);
          } else {
            console.warn(`[OpenRouter] Model ${model} zwrócił 404 (brak endpointu image+text), próbuję fallback...`);
          }
          continue;
        }
        if (err.status === 429) {
          console.warn(`[OpenRouter] Model ${model} rate-limited (429), próbuję fallback...`);
          continue;
        }
        console.error("OpenRouter (AI_IMAGE_PROVIDER) error:", err);
        throw new Error(`OpenRouter (image): ${err.status} ${err.errText.slice(0, 300)}`);
      }
    }
    throw new Error(
      `OpenRouter (image): żaden model nie zadziałał (404). Ostatni: ${lastErr?.status} ${lastErr?.errText?.slice(0, 200) ?? ""}`
    );
  }

  const raw = (process.env.AI_PROVIDER || "mock") as AIProvider;
  if (raw !== "openai" && raw !== "deepseek") {
    // eslint-disable-next-line no-console
    console.log("Using Mock AI Provider");
    return mockAIResponse(prompt);
  }

  const isDeepSeek = raw === "deepseek";
  const apiKey = isDeepSeek
    ? process.env.DEEPSEEK_API_KEY?.trim()
    : process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const msg = isDeepSeek ? "Missing DEEPSEEK_API_KEY" : "Missing OPENAI_API_KEY";
    throw new Error(msg);
  }

  const url = CHAT_URL[isDeepSeek ? "deepseek" : "openai"];
  const useVision = Boolean(imageBase64DataUrl);
  const model = isDeepSeek
    ? (useVision && process.env.DEEPSEEK_VISION_MODEL?.trim())
      ? process.env.DEEPSEEK_VISION_MODEL.trim()
      : (process.env.DEEPSEEK_TASKS_MODEL || DEFAULT_MODEL.deepseek)
    : (process.env.OPENAI_TASKS_MODEL || process.env.OPENAI_MODEL || DEFAULT_MODEL.openai);

  const content: unknown = imageBase64DataUrl
    ? [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageBase64DataUrl } },
      ]
    : prompt;

  try {
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: "user", content }],
      temperature: 0.3,
    };
    if (options?.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        const hint = isDeepSeek
          ? "Użyj AI_PROVIDER=openai i OPENAI_API_KEY lub zwiększ limit DeepSeek."
          : "Użyj AI_PROVIDER=deepseek i DEEPSEEK_API_KEY (często wyższe limity) lub poczekaj.";
        throw new Error(`Zbyt wiele żądań (429). ${hint}`);
      }
      throw new Error(`${isDeepSeek ? "DeepSeek" : "OpenAI"} API: ${response.statusText} ${errText.slice(0, 200)}`);
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    return {
      content: data.choices?.[0]?.message?.content ?? "",
    };
  } catch (error) {
    console.error(`${isDeepSeek ? "DeepSeek" : "OpenAI"} API Error, falling back to mock:`, error);
    return mockAIResponse(prompt);
  }
}

function mockAIResponse(prompt: string): AIResponse {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes("task") || lowerPrompt.includes("checklist")) {
    return {
      content: JSON.stringify([
        { title: "Book Venue", description: "Find and book a reception venue", priority: "HIGH" },
        { title: "Hire Photographer", description: "Research and book a photographer", priority: "MEDIUM" },
        { title: "Send Save the Dates", description: "Notify guests of the date", priority: "MEDIUM" },
      ]),
    };
  }

  if (lowerPrompt.includes("budget")) {
    return {
      content: JSON.stringify([
        { category: "Venue", estimated: 5000 },
        { category: "Catering", estimated: 8000 },
        { category: "Photography", estimated: 2500 },
        { category: "Attire", estimated: 2000 },
      ]),
    };
  }

  if (lowerPrompt.includes("invitation") || lowerPrompt.includes("text")) {
    return {
      content: "Join us for the celebration of our love! We are excited to invite you to our wedding...",
    };
  }

  return {
    content: "This is a mock AI response. Please configure a real AI provider for dynamic content.",
  };
}
