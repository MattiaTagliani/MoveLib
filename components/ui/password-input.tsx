"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = React.ComponentProps<typeof Input>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={`pr-11 ${props.className ?? ""}`}
      />

      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Nascondi password" : "Mostra password"}
        aria-pressed={visible}
        title={visible ? "Nascondi password" : "Mostra password"}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
