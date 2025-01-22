import { Navbar } from "@/components/meetbot/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ChevronRight, Settings } from "lucide-react";

export default function MeetBotLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen flex flex-col">
      <div className="">
        <Navbar />
      </div>
      <div className="flex-grow">{children}</div>
    </div>
  );
}
