// Shared class strings for the "printed" controls used across filter bars.

/** A select trigger that reads as a small-caps label rather than a boxed input. */
export const filterTrigger =
  "caps h-7 w-auto gap-1.5 border-0 bg-transparent px-1.5 text-muted-foreground shadow-none hover:text-foreground data-[state=open]:text-foreground dark:bg-transparent dark:hover:bg-transparent [&_svg]:opacity-60";

/** Applied when a filter holds a non-default value. */
export const filterTriggerActive = "text-foreground underline decoration-destructive decoration-2 underline-offset-[6px]";
