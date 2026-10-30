/** E10 optional structured execution diagnostics; no user/model content. */
export type ExecutionPhase='planning'|'selection'|'generation'|'validation';
export type ExecutionStatus='started'|'completed'|'failed'|'blocked';
export type ExecutionSource='pi-select'|'pi-context'|'requirements-preview'|'pi-validate'|'pi-eval';
export type ExecutionReason='input_invalid'|'catalog_unavailable'|'schema_missing'|'requirements_blocked'|'validation_failed'|'command_failed';
export type ExecutionDetails={
  selectedCount?:number;
  candidateCount?:number;
  issueCount?:number;
  blockerCount?:number;
  valid?:boolean;
  channel?:'stable'|'experimental';
  decision?:'recommended'|'ambiguous'|'no-match';
  reasonCode?:ExecutionReason;
};
export type ExecutionEvent={
  schemaVersion:1;
  eventId:string;
  executionId:string;
  operationId:string;
  sequence:number;
  timestamp:string;
  source:ExecutionSource;
  phase:ExecutionPhase;
  type:string;
  status:ExecutionStatus;
  durationMs?:number;
  details:ExecutionDetails;
};
export declare const EXECUTION_EVENT_SCHEMA_VERSION:1;
export declare const EXECUTION_PHASES:readonly ExecutionPhase[];
export declare const EXECUTION_STATUSES:readonly ExecutionStatus[];
export declare function validateExecutionEvent(event:unknown):event is ExecutionEvent;
export declare function createExecutionRecorder(options:{
  source:ExecutionSource;
  executionId?:string;
  file?:string;
  root?:string;
}):{
  executionId:string;
  start(phase:ExecutionPhase,details?:ExecutionDetails):{
    complete(details?:ExecutionDetails):ExecutionEvent;
    fail(reasonCode:ExecutionReason,details?:ExecutionDetails):ExecutionEvent;
    block(reasonCode:ExecutionReason,details?:ExecutionDetails):ExecutionEvent;
  };
};
