import { Masthead } from "@/components/layout/masthead";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Masthead />
      <main className="page-frame flex-1 pt-10 pb-24">{children}</main>
    </>
  );
}
