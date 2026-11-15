export interface IntegrationReview { id: string; userName: string; businessTitle?: string; rating: number; comment: string; date: string }
export interface IntegrationsData { reviews: IntegrationReview[] }
