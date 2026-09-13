import { generateAIResponse, generateAIVisionResponse } from '../ai';
import { Wedding, Guest } from '@prisma/client';
import type { InvitationQuestionnaire } from './invitation-types';

export interface GeneratedInvitation {
  subject: string;
  htmlContent: string;
  templateName: string;
  /** Wygenerowany obraz zaproszenia (base64 data URL) – gdy AI_IMAGE_PROVIDER=openrouter i model zwrócił image. */
  generatedImageBase64?: string;
}

type WeddingLike = Pick<Wedding, 'name' | 'ceremonyDate' | 'receptionLocation' | 'style' | 'notes'>;

function buildPrompt(
  wedding: WeddingLike,
  guestName: string,
  questionnaire?: InvitationQuestionnaire | null,
  imageAsReference?: boolean
): string {
  const imageIntro = imageAsReference
    ? `Na załączonym obrazie znajduje się wzór zaproszenia. Przeanalizuj go (styl, kolory, układ, typografia, nastrój) i na tej podstawie wygeneruj zaproszenie zgodnie z poniższymi danymi i wymaganiami. Nie kopiuj tekstu z obrazu – użyj naszych danych.\n\n`
    : '';
  const ceremonyDate = wedding.ceremonyDate
    ? new Date(wedding.ceremonyDate).toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'data do ustalenia';
  const location = wedding.receptionLocation || 'miejsce do ustalenia';
  const style = wedding.style || questionnaire?.style || 'klasyczny';
  const notes = wedding.notes || questionnaire?.extraInfo || '';

  let prompt = imageIntro + `Stwórz zaproszenie ślubne w języku polskim dla:
- Imię gościa: ${guestName}
- Nazwa wesela: ${wedding.name}
- Data ceremonii: ${ceremonyDate}
- Miejsce przyjęcia: ${location}
- Styl wesela: ${style}
${notes ? `- Dodatkowe informacje: ${notes}` : ''}`;

  if (questionnaire) {
    prompt += `

WYMAGANIA Z ANKIETY (zastosuj dokładnie):
- Styl: ${questionnaire.style}
- Kolor główny: ${questionnaire.primaryColor}, kolor drugi: ${questionnaire.secondaryColor} (użyj w HTML: tło, nagłówki, przyciski)
- Ton: ${questionnaire.tone === 'cieply' ? 'ciepły i serdeczny' : questionnaire.tone === 'formalny' ? 'formalny' : 'swobodny'}
- Tekst powitalny: "${questionnaire.welcomeText}"
- Podpis na końcu: "${questionnaire.signature}"
- Czcionka: ${questionnaire.fontStyle === 'tradycyjna' ? 'tradycyjna (Georgia, serif)' : questionnaire.fontStyle === 'nowoczesna' ? 'nowoczesna (sans-serif)' : 'ozdobna / kaligrafia'}
${questionnaire.extraInfo ? `- Dodatkowe informacje do umieszczenia: ${questionnaire.extraInfo}` : ''}`;
    if (questionnaire.exampleInvitation?.trim()) {
      prompt += `

PRZYKŁADOWE ZAPROSZENIE (WZÓR) – użyj go jako odniesienia dla stylu, tonu i struktury. Dostosuj treść do naszych danych (data, miejsce, nazwa wesela), zachowaj charakter wzoru:
---
${questionnaire.exampleInvitation.trim().slice(0, 4000)}
---`;
    }
    if (guestName === "{{guestName}}") {
      prompt += `

W treści HTML w miejscu imienia gościa użyj dokładnie placeholder {{guestName}} (zostanie on podstawiony osobno dla każdego gościa).`;
    }
  }

  prompt += `

Zaproszenie powinno:
1. Być osobiste i zawierać wszystkie ważne informacje (data, miejsce)
2. Zawierać miejsce na link do potwierdzenia obecności (RSVP) – w HTML użyj {{invitationLink}}
3. Być gotowe do użycia jako HTML email (inline style, brak zewnętrznych CSS)
${guestName !== "{{guestName}}" ? "" : "\n4. W HTML użyj literalnie {{guestName}} tam, gdzie ma być imię gościa."}

Zwróć TYLKO poprawny JSON bez markdown:
{
  "subject": "Temat emaila",
  "htmlContent": "Pełna treść HTML zaproszenia z zastosowanymi kolorami i stylem z ankiety",
  "templateName": "Nazwa szablonu"
}`;
  return prompt;
}

/**
 * Generates an AI-powered wedding invitation template
 * @param wedding Wedding details
 * @param guest Optional guest for personalized invitation
 * @param questionnaire Optional questionnaire – na podstawie ankiety generowany jest wzór
 * @param options usePlaceholder: true = w HTML użyj {{guestName}} (dla bulk, jedno wywołanie AI)
 */
export async function generateInvitationTemplate(
  wedding: WeddingLike,
  guest?: Pick<Guest, 'name' | 'firstName' | 'lastName'> | null,
  questionnaire?: InvitationQuestionnaire | null,
  options?: { usePlaceholder?: boolean }
): Promise<GeneratedInvitation> {
  const guestName = options?.usePlaceholder ? GUEST_NAME_PLACEHOLDER : (guest?.name || guest?.firstName || 'Drogi Gościu');
  const useImage = Boolean(questionnaire?.exampleImageBase64?.trim());
  const prompt = buildPrompt(wedding, guestName, questionnaire, useImage);

  try {
    let aiResponse: Awaited<ReturnType<typeof generateAIResponse>>;
    if (useImage) {
      try {
        aiResponse = await generateAIVisionResponse(prompt, questionnaire!.exampleImageBase64!.trim(), { jsonMode: true });
      } catch (visionErr) {
        console.warn("AI_IMAGE_PROVIDER (OpenRouter image) failed, falling back to text/HTML:", visionErr);
        aiResponse = await generateAIResponse(prompt, { jsonMode: true });
      }
    } else {
      aiResponse = await generateAIResponse(prompt, { jsonMode: true });
    }

    const generatedImageBase64 = aiResponse.images?.[0];

    if (generatedImageBase64) {
      let subject = `Zaproszenie na ślub - ${wedding.name}`;
      let templateName = `Zaproszenie - ${wedding.name}`;
      try {
        const jsonMatch = aiResponse.content.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]) as { subject?: string; templateName?: string };
          if (parsed.subject) subject = parsed.subject;
          if (parsed.templateName) templateName = parsed.templateName;
        }
      } catch {
        // use defaults
      }
      const htmlContent = `<!DOCTYPE html><html><body style="margin:0;text-align:center;"><img src="${generatedImageBase64}" alt="Zaproszenie" style="max-width:100%;height:auto;" /></body></html>`;
      return { subject, htmlContent, templateName, generatedImageBase64 };
    }

    let parsed: GeneratedInvitation;
    try {
      const jsonMatch = aiResponse.content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
        aiResponse.content.match(/(\{[\s\S]*\})/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse.content;
      parsed = JSON.parse(jsonString) as GeneratedInvitation;
    } catch {
      return getMockInvitation(wedding, guest, questionnaire, options?.usePlaceholder);
    }

    if (!parsed.subject || !parsed.htmlContent) {
      return getMockInvitation(wedding, guest, questionnaire, options?.usePlaceholder);
    }

    return {
      subject: parsed.subject,
      htmlContent: parsed.htmlContent,
      templateName: parsed.templateName || `Zaproszenie - ${wedding.name}`,
    };
  } catch (error) {
    console.error('Error generating invitation with AI:', error);
    return getMockInvitation(wedding, guest, questionnaire, options?.usePlaceholder);
  }
}

/**
 * Mock invitation generator (fallback when AI is unavailable)
 */
function getMockInvitation(
  wedding: Pick<Wedding, 'name' | 'ceremonyDate' | 'receptionLocation' | 'style'>,
  guest?: Pick<Guest, 'name' | 'firstName' | 'lastName'> | null,
  questionnaire?: InvitationQuestionnaire | null,
  usePlaceholder?: boolean
): GeneratedInvitation {
  const guestName = usePlaceholder ? GUEST_NAME_PLACEHOLDER : (guest?.name || guest?.firstName || 'Drogi Gościu');
  const ceremonyDate = wedding.ceremonyDate
    ? new Date(wedding.ceremonyDate).toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'data do ustalenia';

  const location = wedding.receptionLocation || 'miejsce do ustalenia';
  const style = wedding.style || questionnaire?.style || 'klasyczny';

  const styleColors: Record<string, { primary: string; secondary: string }> = {
    boho: { primary: '#8B7355', secondary: '#D4A574' },
    klasyczny: { primary: '#D4AF37', secondary: '#F5E6D3' },
    nowoczesny: { primary: '#2C3E50', secondary: '#ECF0F1' },
    rustykalny: { primary: '#8B4513', secondary: '#DEB887' },
    elegancki: { primary: '#1A1A1A', secondary: '#F5F5DC' },
    minimalistyczny: { primary: '#333333', secondary: '#F8F8F8' },
  };

  const colors = questionnaire
    ? { primary: questionnaire.primaryColor, secondary: questionnaire.secondaryColor }
    : styleColors[style.toLowerCase()] || styleColors.klasyczny;
  const welcomeText = questionnaire?.welcomeText || 'Mamy ogromną przyjemność zaprosić Cię na nasz ślub i przyjęcie weselne.';
  const signature = questionnaire?.signature || 'Para Młoda';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Georgia', 'Times New Roman', serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 2px;">
                Zaproszenie na Ślub
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                Drogi ${guestName},
              </p>
              
              <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                ${welcomeText}
              </p>
              
              <div style="background-color: ${colors.secondary}; padding: 25px; border-radius: 6px; margin: 30px 0; text-align: center;">
                <p style="color: ${colors.primary}; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;">
                  ${wedding.name}
                </p>
                <p style="color: #555; font-size: 16px; margin: 5px 0;">
                  <strong>Data:</strong> ${ceremonyDate}
                </p>
                <p style="color: #555; font-size: 16px; margin: 5px 0;">
                  <strong>Miejsce:</strong> ${location}
                </p>
              </div>
              
              <p style="color: #555; font-size: 16px; line-height: 1.8; margin: 20px 0;">
                Z niecierpliwością czekamy na wspólne świętowanie tego wyjątkowego dnia razem z Tobą!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{invitationLink}}" 
                   style="display: inline-block; background-color: ${colors.primary}; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; letter-spacing: 1px;">
                  Potwierdź Obecność
                </a>
              </div>
              
              <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center; font-style: italic;">
                Z wyrazami szacunku,<br>
                ${signature}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Prosimy o potwierdzenie obecności do {{rsvpDeadline}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return {
    subject: `Zaproszenie na ślub - ${wedding.name}`,
    htmlContent,
    templateName: `Zaproszenie ${style} - ${wedding.name}`,
  };
}

const GUEST_NAME_PLACEHOLDER = "{{guestName}}";

/**
 * Generate invitations for multiple guests.
 * Jedno wywołanie AI dla całej puli (szablon z {{guestName}}), potem podstawienie imion – unika 429.
 * @param questionnaire Optional – na podstawie ankiety (i ewentualnie wzoru) generowany jest szablon
 */
export async function generateBulkInvitations(
  wedding: Pick<Wedding, 'name' | 'ceremonyDate' | 'receptionLocation' | 'style' | 'notes'>,
  guests: Pick<Guest, 'id' | 'name' | 'firstName' | 'lastName'>[],
  questionnaire?: InvitationQuestionnaire | null
): Promise<Map<string, GeneratedInvitation>> {
  const invitations = new Map<string, GeneratedInvitation>();

  if (guests.length === 0) return invitations;

  if (guests.length === 1 && !questionnaire) {
    const one = await generateInvitationTemplate(wedding, guests[0], null);
    invitations.set(guests[0].id, one);
    return invitations;
  }

  const base = await generateInvitationTemplate(wedding, null, questionnaire ?? undefined, { usePlaceholder: true });
  const guestNameRe = new RegExp(GUEST_NAME_PLACEHOLDER.replace(/[{}]/g, "\\$&"), "gi");

  for (const guest of guests) {
    const name = guest.name || guest.firstName || [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "Gość";
    const htmlContent = base.htmlContent.replace(guestNameRe, name);
    invitations.set(guest.id, {
      subject: base.subject,
      htmlContent,
      templateName: base.templateName,
    });
  }

  return invitations;
}
