import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav className="shadow-sm border-b border-white/10 bg-[#222]">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/meetbot" className="text-2xl font-bold text-white">
              MeetBot
            </Link>
          </div>
          <div className="ml-6 flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
