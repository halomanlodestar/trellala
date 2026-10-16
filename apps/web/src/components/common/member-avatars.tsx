import type { PersonView } from "@trellala/core/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

type Props = { people: PersonView[]; max?: number };

export function MemberAvatars({ people, max = 4 }: Props) {
  if (people.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  const shown = people.slice(0, max);

  return (
    <div className="flex -space-x-1.5" title={people.map((p) => p.name).join(", ")}>
      {shown.map((p) => (
        <Avatar key={p.id} className="size-6 border border-background ring-1 ring-border">
          {p.image && <AvatarImage src={p.image} alt={p.name} className="grayscale" />}
          <AvatarFallback className="bg-muted font-mono text-[9px]">{initials(p.name)}</AvatarFallback>
        </Avatar>
      ))}
      {people.length > max && (
        <span className="figures flex size-6 items-center justify-center rounded-full border border-background bg-muted text-[9px] ring-1 ring-border">
          +{people.length - max}
        </span>
      )}
    </div>
  );
}
