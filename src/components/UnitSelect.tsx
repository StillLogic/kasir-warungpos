import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, PenLine } from "lucide-react";
import { addUnit } from "@/database/units";
import { useToast } from "@/hooks/use-toast";
import { handleTitleCaseChange } from "@/lib/text";

interface UnitSelectProps {
  value: string;
  units: string[];
  onValueChange: (value: string) => void;
  onUnitsChanged?: () => void;
}

export function UnitSelect({
  value,
  units,
  onValueChange,
  onUnitsChanged,
}: UnitSelectProps) {
  const { toast } = useToast();
  const [isCustom, setIsCustom] = useState(false);
  const [customUnit, setCustomUnit] = useState("");

  const handleSelectChange = (val: string) => {
    if (val === "__custom__") {
      setIsCustom(true);
      setCustomUnit("");
    } else {
      onValueChange(val);
    }
  };

  const handleConfirmCustom = () => {
    const trimmed = customUnit.trim();
    if (!trimmed) {
      toast({
        title: "Error",
        description: "Nama satuan harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Check if already exists (case-insensitive)
    const existing = units.find(
      (u) => u.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      onValueChange(existing);
      setIsCustom(false);
      setCustomUnit("");
      return;
    }

    // Add to master data
    const result = addUnit(trimmed);
    if (result) {
      onUnitsChanged?.();
      setTimeout(() => onValueChange(result.name), 0);
      toast({
        title: "Berhasil",
        description: `Satuan "${result.name}" ditambahkan ke Master Data`,
      });
    } else {
      onValueChange(trimmed);
    }

    setIsCustom(false);
    setCustomUnit("");
  };

  const handleCancelCustom = () => {
    setIsCustom(false);
    setCustomUnit("");
  };

  if (isCustom) {
    return (
      <div className="flex gap-1">
        <Input
          placeholder="Ketik satuan..."
          value={customUnit}
          onChange={(e) => handleTitleCaseChange(e, setCustomUnit)}
          maxLength={30}
          className="flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleConfirmCustom();
            } else if (e.key === "Escape") {
              handleCancelCustom();
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-green-600"
          onClick={handleConfirmCustom}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-destructive"
          onClick={handleCancelCustom}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem key={unit} value={unit}>
            {unit}
          </SelectItem>
        ))}
        <SelectItem
          value="__custom__"
          className="text-primary font-medium border-t mt-1 pt-2"
        >
          <span className="flex items-center gap-2">
            <PenLine className="w-3 h-3" />
            Ketik Manual...
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
