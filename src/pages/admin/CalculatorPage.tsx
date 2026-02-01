import { useIsMobile } from "@/hooks/use-mobile";
import { MobileCalculator } from "@/components/admin/MobileCalculator";
import { DesktopCalculator } from "@/components/admin/DesktopCalculator";

export function CalculatorPage() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileCalculator />;
  }

  return <DesktopCalculator />;
}
