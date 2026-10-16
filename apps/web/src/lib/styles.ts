// Shared class strings for the "printed" controls used across filter bars.

/** A select trigger that reads as a small-caps label rather than a boxed input. */
export const filterTrigger =
  "caps h-7 w-auto gap-1.5 border-0 bg-transparent px-1.5 text-muted-foreground shadow-none hover:text-foreground data-[state=open]:text-foreground dark:bg-transparent dark:hover:bg-transparent [&_svg]:opacity-60";

/** Applied when a filter holds a non-default value. */
export const filterTriggerActive = "text-foreground underline decoration-destructive decoration-2 underline-offset-[6px]";

/** A printed checkbox chip for on/off options; state comes from `aria-pressed`. */
export const toggleChip =
  "caps inline-flex items-center gap-1.5 rounded-xs border px-2 py-1 text-muted-foreground transition-colors hover:text-foreground before:size-2.25 before:rounded-[1px] before:border-[1.5px] before:border-current aria-pressed:border-foreground aria-pressed:text-foreground aria-pressed:before:bg-foreground aria-pressed:before:shadow-[inset_0_0_0_1.5px_var(--background)]";

/** Timeline rows: a fixed label column (`--lab`) and a time track. */
export const timelineRow = "grid grid-cols-[var(--lab)_minmax(0,1fr)] border-b";
export const timelineLabel = "sticky left-0 z-10 flex min-w-0 items-center gap-2 border-r bg-background py-2.5 pr-3";
