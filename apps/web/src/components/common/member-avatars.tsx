/** @format */

import type { PersonView } from "@trellala/core/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

type Props = { people: PersonView[]; max?: number };

export function MemberAvatars({ people, max = 4 }: Props) {
  if (people.length === 0)
    return <span className="text-sm text-muted-foreground">—</span>;

  const shown = people.slice(0, max);

  return (
    <div
      className="flex -space-x-2"
      title={people.map((p) => p.name).join(", ")}
    >
      {shown.map((p) => (
        <Avatar key={p.id} className="size-6 border-2 border-background">
          {p.image && <AvatarImage src={p.image} alt={p.name} />}
          <AvatarFallback className="text-[10px]">
            {initials(p.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {people.length > max && (
        <span className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px]">
          +{people.length - max}
        </span>
      )}
    </div>
  );
}
