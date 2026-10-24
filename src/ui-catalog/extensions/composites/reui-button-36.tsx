import {
  RiFacebookFill,
  RiGithubFill,
  RiGoogleFill,
  RiInstagramFill,
  RiLinkedinFill,
  RiTwitterXFill,
} from "./reui-button-adapters"

import { Button } from "@/components/ui/button"

export function ReuiButtonPattern36() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon">
        <RiGoogleFill aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon">
        <RiFacebookFill aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon">
        <RiTwitterXFill aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon">
        <RiGithubFill aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon">
        <RiLinkedinFill aria-hidden="true" />
      </Button>
      <Button variant="outline" size="icon">
        <RiInstagramFill aria-hidden="true" />
      </Button>
    </div>
  )
}
