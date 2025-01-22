"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, UserCircle } from "lucide-react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { projects } from "@/lib/constants";

export default function LandingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<{
    name: string;
    link: string;
    description: string;
  }>();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const router = useRouter();
  const user = useUser();

  const handleSignIn = () => {
    // In a real application, you would implement proper authentication here
    router.push("/sign-in");
  };

  useEffect(() => {
    // Check if the user is signed in
    if (user.isSignedIn) {
      setIsSignedIn(true);
      setUserData(user.user);
    }
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <title>C3ALabs - R&D</title>
      <Card className="w-full max-w-md mb-6">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            C3ALabs R&D
          </CardTitle>
          <CardDescription className="text-center">
            Innovative Research & Development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Limited Access</AlertTitle>
            <AlertDescription>
              At present, access is restricted to users with certain
              credentials. Only authorized personnel are permitted to explore
              the projects.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          {!isSignedIn ? (
            <Button onClick={handleSignIn} className="w-full">
              Sign In
            </Button>
          ) : (
            <div className="w-full flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="relative h-6 w-6 ">
                  {userData?.imageUrl ? (
                    <Image
                      src={userData.imageUrl}
                      className="rounded-full"
                      alt="User Profile"
                      fill
                    />
                  ) : (
                    <UserCircle className="h-6 w-6 text-green-500" />
                  )}
                </div>
                <span className="font-medium">
                  {userData?.fullName || "Authorized User"}
                </span>
              </div>
              <SignOutButton>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSignedIn(false);
                    setUserData({});
                  }}
                >
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          )}
        </CardFooter>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {projects.map((project) => (
              <Card
                key={project.name}
                className={`cursor-pointer transition-shadow duration-200 ${
                  isSignedIn ? "hover:shadow-md" : "opacity-50"
                }`}
                onClick={() => {
                  if (isSignedIn) {
                    router.push(`${project.link}`);
                  }
                }}
              >
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
