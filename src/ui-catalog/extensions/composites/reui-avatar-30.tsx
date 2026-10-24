/** ReUI c-avatar-30: composição TSX independente. */
"use client"

import { useEffect, useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Spinner } from "@/components/ui/spinner"

export default function Pattern() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => setLoading((prev) => !prev), 2000) // Toggle loading state every 2 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <Avatar>
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      {loading && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center rounded-full">
          <Spinner className="text-primary" />
        </div>
      )}
    </div>
  )
}
