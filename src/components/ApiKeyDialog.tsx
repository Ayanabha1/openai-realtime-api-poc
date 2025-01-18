import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onSubmit: (apiKey: string) => void;
}

export function ApiKeyDialog({ isOpen, onSubmit }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      apiKey.trim() &&
      password.trim() === process.env.NEXT_PUBLIC_ACCESS_PASSWORD
    ) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter OpenAI API Key and Password</DialogTitle>
          <DialogDescription>
            Please provide your OpenAI API key and password to use this
            application. The key and password are required and cannot be
            skipped.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 pt-0">
            <div className="items-center gap-4">
              <Label htmlFor="apiKey" className="text-right">
                API Key
              </Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="mt-2"
                required
              />
            </div>
            <div className="items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="your password"
                className="mt-2"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !apiKey.trim() ||
                password !== process.env.NEXT_PUBLIC_ACCESS_PASSWORD
              }
              className="w-full"
            >
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
