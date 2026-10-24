import type { ReactNode } from "react";
import { Field as ShadcnField, FieldContent, FieldTitle, FieldDescription } from "@/components/ui/field";

/** Adaptador isolado: o JSON só fornece orientação, textos e um slot aprovado. */
export type FieldProps = {
  label: string;
  description: string | null;
  orientation?: "vertical" | "horizontal" | "responsive";
  invalid?: boolean;
};

export function Field({props,children}:{props:FieldProps;children?:ReactNode}) {
  return <ShadcnField orientation={props.orientation ?? "vertical"} data-invalid={props.invalid || undefined}>
    <FieldContent>
      <FieldTitle>{props.label}</FieldTitle>
      {props.description && <FieldDescription>{props.description}</FieldDescription>}
    </FieldContent>
    {children}
  </ShadcnField>;
}
