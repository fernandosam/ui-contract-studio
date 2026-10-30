import type { ContractSdk, ContractChannel } from "./contract-sdk";

export type ContractOperation = "list" | "inspect" | "validate" | "generate";
export type ContractPermission =
  | "contracts:read"
  | "contracts:validate"
  | "contracts:generate"
  | "contracts:experimental";

export interface TrustedContractIdentity {
  /** Derived by an independently verified host, never from the request body. */
  readonly subject: string;
  readonly tenantId: string;
  readonly scopes: ReadonlySet<string>;
}
export interface ContractUsageLimits {
  readonly authAttemptsPerMinute: number;
  readonly globalAuthAttemptsPerMinute: number;
  readonly requestsPerMinute: number;
  readonly requestsPerDay: number;
  readonly concurrentPerPrincipal: number;
  readonly concurrentGlobal: number;
  readonly concurrentAuthentication: number;
  readonly maxRequestBytes: number;
  readonly maxInputNodes: number;
  readonly maxInputDepth: number;
  readonly maxTrackedPeers: number;
  readonly maxTrackedPrincipals: number;
}
export interface ContractGatewayOptions {
  /** Existing local SDK; no remote network endpoint is created. */
  readonly stableSdk: ContractSdk<"stable">;
  readonly experimentalSdk?: ContractSdk<"experimental">;
  /** Must validate the supplied bearer credential externally (e.g. OIDC JWKS). */
  readonly authenticate: (bearerToken: string) => Promise<TrustedContractIdentity | null>;
  readonly limits?: Partial<ContractUsageLimits>;
  /** Trusted monotonic-ish Unix epoch milliseconds, intended for deterministic tests. */
  readonly clock?: () => number;
}
export interface TrustedHostTransport {
  /** Derived from trusted network/host metadata, never X-Forwarded-For without proxy validation. */
  readonly peerId: string;
  readonly bearerToken: string;
}
export type ContractGatewayCommand =
  | Readonly<{ operation: "list"; channel?: ContractChannel }>
  | Readonly<{ operation: "inspect"; input: string; channel?: ContractChannel }>
  | Readonly<{ operation: "validate"; input: unknown; channel?: ContractChannel }>
  | Readonly<{ operation: "generate"; input: unknown; channel?: ContractChannel }>;
export type ContractGatewayResult =
  | Readonly<{ ok: true; status: 200; value: unknown }>
  | Readonly<{
      ok: false;
      status: 400 | 401 | 403 | 413 | 429 | 503;
      error:
        | "unauthorized" | "forbidden" | "invalid_request" | "payload_too_large"
        | "rate_limited" | "quota_exceeded" | "busy" | "unavailable";
      retryAfterSeconds?: number;
    }>;
export interface ProtectedContractGateway {
  readonly limits: Readonly<ContractUsageLimits>;
  execute(
    hostTransport: TrustedHostTransport,
    command: ContractGatewayCommand,
  ): Promise<ContractGatewayResult>;
}
export function createProtectedContractGateway(
  options: ContractGatewayOptions,
): ProtectedContractGateway;
