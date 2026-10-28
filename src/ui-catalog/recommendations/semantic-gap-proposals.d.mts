export type GapAvailability = "verified-static"|"not-implemented"|"missing-evidence"|"runtime-review-required"|"missing-record";
export type GapProposalStatus = "candidate-review-only"|"runtime-review-required"|"blocked-implementation"|"blocked-evidence"|"blocked-authorization";
export type SemanticGapReference = {
  component:string;capability:string;description:string;state:string;
  availability:GapAvailability;source:string|null;reason:string;
  evidenceChecks:readonly {path:string|null;contains:string|null;status:string}[];
  testRequirements:readonly string[];
};
export type SemanticCompositionProposal = {
  id:string;scenarioId:string;family:string;title:string;target:string|null;
  strategy:string;kind:string;status:GapProposalStatus;
  approval:"candidate-not-admitted";canUseInPi:false;
  originGaps:readonly SemanticGapReference[];
  requiredCapabilities:readonly SemanticGapReference[];
  evidence:readonly SemanticGapReference[];
  dependencies:readonly {name:string;approvedPiType:boolean;source:string}[];
  implementationLimitations:readonly string[];
  admissionLimitations:readonly string[];
  suggestedTests:readonly {mode:string;description:string;status:"planned-not-executed"}[];
  provenance:readonly string[];
};
export type SemanticGapProposalReport = {
  schemaVersion:1;authority:"advisory-only";disclaimer:string;source:string;
  summary:{auditGaps:number;coveredGaps:number;uncoveredGaps:number;
    proposals:number;byStatus:Record<GapProposalStatus,number>};
  proposals:readonly SemanticCompositionProposal[];
  uncoveredGaps:readonly (SemanticGapReference & {limitation:string})[];
};
type AuditEntry = Partial<SemanticGapReference> & Pick<SemanticGapReference,"component"|"capability"|"availability">;
type ScenarioInput = {
  id:string;family:string;title:string;target:string|null;strategy:string;
  dependencies:readonly string[];requiredCapabilities:readonly string[];
  tests:readonly (readonly [string,string])[];
};
export declare function buildSemanticCompositionProposals(input:{
  capabilityAudit:{entries:readonly AuditEntry[];gaps?:readonly AuditEntry[]};
  scenarios:readonly ScenarioInput[];
  approvedPiTypes:ReadonlySet<string>|readonly string[];
}):SemanticGapProposalReport;
