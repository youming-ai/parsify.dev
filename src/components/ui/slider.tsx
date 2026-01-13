import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root ref={ref} className={cn(className)} {...props} />
));
Slider.displayName = SliderPrimitive.Root.displayName;

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

export { Slider };
