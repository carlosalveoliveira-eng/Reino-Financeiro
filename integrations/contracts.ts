/** Integration ports. None of these contracts implies a configured connection. */
export type ExternalTransaction={externalId:string;accountId:string;postedOn:string;amountMinor:number;currency:string;description:string};
export interface BankingProvider{createConsent(userId:string,returnTo:string):Promise<{authorizationUrl:string;consentId:string}>;listAccounts(consentId:string):Promise<{externalId:string;name:string;currency:string}[]>;listTransactions(consentId:string,accountId:string,since?:string):Promise<ExternalTransaction[]>;revokeConsent(consentId:string):Promise<void>}
export interface MarketDataProvider{quote(symbol:string):Promise<{symbol:string;currency:string;unitPriceMinor:number;asOf:string;source:string}>}
export interface NotificationProvider{send(userId:string,message:{title:string;body:string;eventId:string}):Promise<void>}
export interface AssistantProvider{answer(input:{userId:string;question:string;toolNames:string[]}):Promise<{text:string;sources:string[]}>}
export function unavailableIntegration(name:string):never{throw new Error(`${name} precisa de um provedor configurado. Nenhum dado simulado será usado.`)}
