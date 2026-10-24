import { useState, useCallback, useRef } from 'react';
import { Search, ArrowRight, ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Check, Copy, Menu, X, Sun, Moon, Heart, Star, Bell, Github, Facebook, Instagram, Linkedin, LoaderCircle, Send, ExternalLink, Settings, Mail, CircleCheck, Globe, MoreHorizontal, Download, Upload, LogIn, QrCode, CircleHelp, Sparkles, type LucideIcon } from 'lucide-react';
const icons: Record<string, LucideIcon> = {
  SearchIcon:Search, ArrowRightIcon:ArrowRight, ArrowLeftIcon:ArrowLeft,
  ArrowUpRightIcon:ExternalLink, ChevronUpIcon:ChevronUp, ChevronDownIcon:ChevronDown,
  ChevronLeftIcon:ChevronLeft, ChevronRightIcon:ChevronRight, PlusIcon:Plus,
  MinusIcon:Minus, CheckIcon:Check, CopyIcon:Copy, MenuIcon:Menu,
  XIcon:X, SunIcon:Sun, MoonIcon:Moon, HeartIcon:Heart, StarIcon:Star,
  BellIcon:Bell, GithubIcon:Github, GitHubIcon:Github, FacebookIcon:Facebook,
  InstagramIcon:Instagram, LinkedinIcon:Linkedin, LoaderIcon:LoaderCircle,
  SendIcon:Send, ExternalLinkIcon:ExternalLink, SettingsIcon:Settings,
  MailIcon:Mail, CheckCircleIcon:CircleCheck, GlobeIcon:Globe,
  EllipsisIcon:MoreHorizontal, DownloadIcon:Download, UploadIcon:Upload,
  LogInIcon:LogIn, QrCodeIcon:QrCode, CircleHelpIcon:CircleHelp, SparklesIcon:Sparkles,
};
type IconProps={lucide?:string;tabler?:string;hugeicons?:string;phosphor?:string;remixicon?:string;className?:string;size?:number;strokeWidth?:number;'data-icon'?:string;'aria-hidden'?:boolean|'true'|'false'};
export function IconPlaceholder({lucide,className,...props}:IconProps){
 const Icon=icons[lucide??'']??Sparkles;
 return <Icon className={className} {...props}/>;
}
export const RiFacebookFill=Facebook;
export const RiGithubFill=Github;
export const RiGoogleFill=Globe;
export const RiInstagramFill=Instagram;
export const RiLinkedinFill=Linkedin;
export const RiTwitterXFill=X;
export const RiAppleFill=Globe;
export const RiDiscordFill=Globe;
export function useCopyToClipboard({timeout=1500}:{timeout?:number}={}){
 const [isCopied,setCopied]=useState(false);
 const ref=useRef<ReturnType<typeof setTimeout>|null>(null);
 const copyToClipboard=useCallback(async(text:string)=>{
  try{await navigator.clipboard.writeText(text);setCopied(true);if(ref.current)clearTimeout(ref.current);ref.current=setTimeout(()=>setCopied(false),timeout);}
  catch{setCopied(false)}
 },[timeout]);
 return {isCopied,copyToClipboard};
}

import {Badge as ShadcnBadge} from '@/components/ui/badge';
import type {HTMLAttributes} from 'react';
export function Badge({variant='secondary',size='sm',className,...props}:HTMLAttributes<HTMLSpanElement>&{variant?:string;size?:'xs'|'sm'|'md'}){
 const mapped=variant.includes('destructive')?'destructive':variant.includes('success')?'secondary':variant.includes('outline')?'outline':'secondary';
 return <ShadcnBadge {...props} variant={mapped} className={[size==='xs'?'text-[10px]':'text-xs',className].filter(Boolean).join(' ')}/>;
}
export function Kbd({className,...props}:HTMLAttributes<HTMLElement>){
 return <kbd {...props} className={['inline-flex min-w-4 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] leading-4 text-muted-foreground',className].filter(Boolean).join(' ')}/>;
}
export function KbdGroup({className,...props}:HTMLAttributes<HTMLSpanElement>){
 return <span {...props} className={['inline-flex items-center gap-1',className].filter(Boolean).join(' ')}/>;
}
