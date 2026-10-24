/** ReUI c-carousel-5; composição TSX independente (sem plugins não aprovados). */
import { useEffect, useState } from "react"
import type { CarouselApi } from "@/components/ui/carousel"

import { Card } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

export default function Pattern() {
  const [api, setApi] = useState<CarouselApi>()
  useEffect(() => {
    if (!api) return
    const interval = setInterval(() => api.scrollNext(), 2000)
    return () => clearInterval(interval)
  }, [api])
  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      className="w-full max-w-xs"
    >
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={index}>
            <div className="p-1">
              <Card className="relative aspect-square overflow-hidden border-0 p-0">
                <img
                  src={`https://picsum.photos/800/800?grayscale&random=${index + 25}`}
                  alt={`Slide ${index + 1}`}
                  width={800}
                  height={800}
                  className="h-full w-full object-cover"
                />
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
