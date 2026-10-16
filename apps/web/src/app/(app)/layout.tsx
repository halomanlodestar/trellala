import { Masthead } from "@/components/layout/masthead";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Masthead />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-24 md:px-8">{children}</main>
    </>
  );
}
