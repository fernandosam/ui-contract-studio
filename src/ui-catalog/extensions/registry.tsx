import type { ReactNode } from 'react';
import { AlertDialog,type AlertDialogProps } from "./components/alert-dialog";
import { Attachment,type AttachmentProps } from "./components/attachment";
import { Bubble,type BubbleProps } from "./components/bubble";
import { ContextMenu,type ContextMenuProps } from "./components/context-menu";
import { HoverCard,type HoverCardProps } from "./components/hover-card";
import { Item,type ItemProps } from "./components/item";
import { Marker,type MarkerProps } from "./components/marker";
import { Message,type MessageProps } from "./components/message";
import { AspectRatio,type AspectRatioProps } from "./components/aspect-ratio";
import { Kbd,type KbdProps } from "./components/kbd";
import { Empty,type EmptyProps } from "./components/empty";
import { ScrollArea,type ScrollAreaProps } from "./components/scroll-area";

import { OnboardingChecklist, type OnboardingChecklistProps } from './components/onboarding-checklist';
import { RatingDistribution, type RatingDistributionProps } from "./components/rating-distribution";
import { CharacterCountTextarea, type CharacterCountTextareaProps } from "./components/character-count-textarea";
import { compositeImplementations } from './generated/composite-implementations';
import { DataTable,type DataTableProps } from './components/data-table';
import { DatePicker,type DatePickerProps } from './components/date-picker';
import { Field,type FieldProps } from './components/field';
import { BlockSidebar, type BlockSidebarProps } from "./components/block-sidebar";
import { SiteCardsActivityGoal, type SiteCardsActivityGoalProps } from "./components/site-cards-activity-goal";
import { SiteCardsChat, type SiteCardsChatProps } from "./components/site-cards-chat";
import { SiteCardsCookieSettings, type SiteCardsCookieSettingsProps } from "./components/site-cards-cookie-settings";
import { SiteCardsPaymentMethod, type SiteCardsPaymentMethodProps } from "./components/site-cards-payment-method";
import { SiteCardsTeamMembers, type SiteCardsTeamMembersProps } from "./components/site-cards-team-members";

export const extensionImplementations = {
 AlertDialog: ({props,emit}:{props:AlertDialogProps;emit?:(name:"confirm")=>void})=><AlertDialog props={props} emit={emit}/>,
 Attachment: ({props}:{props:AttachmentProps})=><Attachment props={props}/>,
 Bubble: ({props}:{props:BubbleProps})=><Bubble props={props}/>,
 ContextMenu: ({props,emit}:{props:ContextMenuProps;emit?:(name:"select")=>void})=><ContextMenu props={props} emit={emit}/>,
 HoverCard: ({props}:{props:HoverCardProps})=><HoverCard props={props}/>,
 Item: ({props}:{props:ItemProps})=><Item props={props}/>,
 Marker: ({props}:{props:MarkerProps})=><Marker props={props}/>,
 Message: ({props}:{props:MessageProps})=><Message props={props}/>,
 AspectRatio: ({props,children}:{props:AspectRatioProps;children?:ReactNode})=><AspectRatio props={props}>{children}</AspectRatio>,
 Kbd: ({props}:{props:KbdProps})=><Kbd props={props}/>,
 Empty: ({props,children}:{props:EmptyProps;children?:ReactNode})=><Empty props={props}>{children}</Empty>,
 ScrollArea: ({props,children}:{props:ScrollAreaProps;children?:ReactNode})=><ScrollArea props={props}>{children}</ScrollArea>,
 DataTable: ({props,bindings,emit}:{props:DataTableProps;bindings?:{selectedIds?:string};emit?:(name:'selectionChange'|'pageChange'|'sortChange')=>void})=><DataTable props={props} selectionPath={bindings?.selectedIds}
   onSelectionChange={()=>emit?.('selectionChange')} onPageChange={()=>emit?.('pageChange')} onSortChange={()=>emit?.('sortChange')}/>,
 DatePicker: ({props,bindings,emit}:{props:DatePickerProps;bindings?:{value?:string};emit?:(name:'change')=>void})=><DatePicker props={props} statePath={bindings?.value} onChange={()=>emit?.('change')}/>,
 Field: ({props,children}:{props:FieldProps;children?:ReactNode})=><Field props={props}>{children}</Field>,
  OnboardingChecklist: ({props}:{props:OnboardingChecklistProps}) => <OnboardingChecklist props={props} />,
  RatingDistribution: ({props}:{props:RatingDistributionProps}) => <RatingDistribution props={props} />,
  CharacterCountTextarea: ({props}:{props:CharacterCountTextareaProps}) => <CharacterCountTextarea props={props} />,
  // Stateful implementations remain explicit; 113 static compositions are generated.
  BlockSidebar: ({props}:{props:BlockSidebarProps}) => <BlockSidebar props={props} />,
  SiteCardsActivityGoal: ({props,emit}:{props:SiteCardsActivityGoalProps;emit?:(event:string)=>void}) => <SiteCardsActivityGoal props={props} onEvent={emit} />,
  SiteCardsChat: ({props,emit}:{props:SiteCardsChatProps;emit?:(event:string)=>void}) => <SiteCardsChat props={props} onEvent={emit} />,
  SiteCardsCookieSettings: ({props,emit}:{props:SiteCardsCookieSettingsProps;emit?:(event:string)=>void}) => <SiteCardsCookieSettings props={props} onEvent={emit} />,
  SiteCardsPaymentMethod: ({props,emit}:{props:SiteCardsPaymentMethodProps;emit?:(event:string)=>void}) => <SiteCardsPaymentMethod props={props} onEvent={emit} />,
  SiteCardsTeamMembers: ({props,emit}:{props:SiteCardsTeamMembersProps;emit?:(event:string)=>void}) => <SiteCardsTeamMembers props={props} onEvent={emit} />,

  ...compositeImplementations,
};
