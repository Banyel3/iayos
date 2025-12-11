// MessageInput Component
// Input field with send button and typing indicator trigger
// Ported from React Native mobile app

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/form_button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Loader2 } from "lucide-react";

type MessageInputProps = {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onImageSelect?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  isUploading?: boolean;
};

export default function MessageInput({
  onSend,
  onTyping,
  onImageSelect,
  disabled = false,
  placeholder = "Type a message...",
  isUploading = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled && !isUploading) {
      onSend(trimmedMessage);
      setMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping?.();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelect) {
      onImageSelect(file);
      // Reset file input
      e.target.value = "";
    }
  };

  const triggerImageSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-center gap-2">
        {/* Image upload button */}
        {onImageSelect && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              disabled={disabled || isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={triggerImageSelect}
              disabled={disabled || isUploading}
              className="flex-shrink-0"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </Button>
          </>
        )}

        {/* Message input */}
        <Input
          ref={inputRef}
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="flex-1"
        />

        {/* Send button */}
        <Button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled || isUploading}
          className="flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
