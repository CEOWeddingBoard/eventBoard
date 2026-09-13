export interface OnboardingAnswers {
  weddingDate: string
  budget: number
  guestCount: number
  style: string
  formality: "formal" | "semi_formal" | "casual"
  priorities: string[]
  venueType: string
}

export interface AiTimelineTask {
  title: string
  category: string
  deadline: string
  notes: string
}

export interface PersonalizedPlan {
  timeline: AiTimelineTask[]
  budgetBreakdown: { category: string; recommended: number; tip: string }[]
  vendorSuggestions: string[]
  personalizedTips: string[]
}
