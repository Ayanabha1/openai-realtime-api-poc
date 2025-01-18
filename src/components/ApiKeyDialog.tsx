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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSubmit(apiKey.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter OpenAI API Key</DialogTitle>
          <DialogDescription>
            Please provide your OpenAI API key to use this application. The key
            is required and cannot be skipped.
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!apiKey.trim()} className="w-full">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
