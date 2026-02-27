import { useState } from "react";
import { flushSync } from "react-dom";
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
import { addCategory } from "@/database/categories";
import { useToast } from "@/hooks/use-toast";
import { handleTitleCaseChange } from "@/lib/text";

interface CategorySelectProps {
  value: string;
  categories: string[];
  onValueChange: (value: string) => void;
  onCategoriesChanged?: () => void;
}

export function CategorySelect({
  value,
  categories,
  onValueChange,
  onCategoriesChanged,
}: CategorySelectProps) {
  const { toast } = useToast();
  const [isCustom, setIsCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrefix, setCustomPrefix] = useState("");

  const handleSelectChange = (val: string) => {
    if (val === "__custom__") {
      setIsCustom(true);
      setCustomName("");
      setCustomPrefix("");
    } else {
      onValueChange(val);
    }
  };

  const generatePrefix = (name: string): string => {
    const clean = name.trim().toUpperCase();
    if (clean.length <= 3) return clean;
    // Take first 3 consonants or first 3 chars
    const consonants = clean.replace(/[AIUEO\s]/g, "");
    if (consonants.length >= 3) return consonants.substring(0, 3);
    return clean.substring(0, 3);
  };

  const handleConfirmCustom = () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      toast({
        title: "Error",
        description: "Nama kategori harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Check if already exists
    const existing = categories.find(
      (c) => c.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (existing) {
      flushSync(() => {
        onValueChange(existing);
      });
      setIsCustom(false);
      setCustomName("");
      setCustomPrefix("");
      return;
    }

    const prefix = customPrefix.trim() || generatePrefix(trimmedName);
    const result = addCategory(trimmedName, prefix);
    if (result) {
      flushSync(() => {
        onCategoriesChanged?.();
        onValueChange(result.name);
      });
      toast({
        title: "Berhasil",
        description: `Kategori "${result.name}" ditambahkan ke Master Data`,
      });
    } else {
      toast({
        title: "Gagal",
        description: "Kategori atau prefix sudah ada",
        variant: "destructive",
      });
    }

    setIsCustom(false);
    setCustomName("");
    setCustomPrefix("");
  };

  const handleCancelCustom = () => {
    setIsCustom(false);
    setCustomName("");
    setCustomPrefix("");
  };

  if (isCustom) {
    return (
      <div className="space-y-2">
        <div className="flex gap-1">
          <Input
            placeholder="Nama kategori..."
            value={customName}
            onChange={(e) => {
              handleTitleCaseChange(e, setCustomName);
              setCustomPrefix(generatePrefix(e.target.value));
            }}
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Prefix:</span>
          <Input
            placeholder="ABC"
            value={customPrefix}
            onChange={(e) => setCustomPrefix(e.target.value.toUpperCase().slice(0, 3))}
            maxLength={3}
            className="w-20 h-7 text-xs"
          />
        </div>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange}>
      <SelectTrigger>
        <SelectValue placeholder="Pilih kategori" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
        <SelectItem
          value="__custom__"
          className="text-primary font-medium border-t mt-1 pt-2"
        >
          <span className="flex items-center gap-2">
            <PenLine className="w-3 h-3" />
            Buat Kategori Baru...
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
