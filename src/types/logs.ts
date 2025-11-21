export interface Client {
  clientCode: string;
  apiKey: string;
  secretKey: string;
  totp: string;
  isAuthenticated: boolean;
}

export interface NewClientData {
  clientCode: string;
  apiKey: string;
  secretKey: string;
  totp: string;
}

// export interface OrderRequest {
//   clientcode?: string;
//   exchange: string;
//   symboltoken: string;
//   buyorsell: string;
//   ordertype: string;
//   quantity: number;
//   price?: number;
//   triggerprice?: number;
//   producttype?: string;
// }

// export interface TradeLog {
//   id: number;
//   requestId: string;
//   traceId: string;
//   endpoint: string;
//   httpMethod: string;
//   clientCode: string;
//   masterClient: string;
//   replicatedClient: string;
//   requestTime: string;
//   responseTime: string;
//   durationMs: number;
//   status: string;
//   statusCode: number;
//   errorMessage: string;
//   message: string;
//   exchange?: string;
//   symbolToken?: string;
//   buyOrSell?: string;
//   orderType?: string;
//   quantity?: number;
//   price?: number;
//   uniqueOrderId?: string;
// }

// // export interface LogsResponse {
// //   status: string;
// //   requestId?: string;
// //   traceId?: string;
// //   clientCode?: string;
// //   count: number;
// //   logs: TradeLog[];
// //   lokiLogs?: any[];
// //   grafanaLokiUrl?: string;
// // }


// // export interface TimelineResponse {
// //   status: string;
// //   totalLogs: number;
// //   filters: Record<string, any>;
// //   timeline: any[];
// //   groupedByEndpoint: Record<string, any[]>;
// //   statistics: {
// //     successCount: number;
// //     errorCount: number;
// //     avgDurationMs: number;
// //     requestTypeBreakdown: Record<string, number>;
// //   };
// // }