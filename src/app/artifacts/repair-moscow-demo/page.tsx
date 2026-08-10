import { RepairMoscowDemo } from "@/components/artifacts/repair-moscow-demo/RepairMoscowDemo";
import {
  isValidTelegramUsername,
  normalizeTelegramUsername,
} from "@/lib/artifacts/repair-moscow-demo/telegram";

export default function RepairMoscowDemoPage() {
  const normalizedTelegramUsername = normalizeTelegramUsername(
    process.env.NEXT_PUBLIC_REPAIR_DEMO_TELEGRAM_USERNAME,
  );
  const telegramUsername = isValidTelegramUsername(normalizedTelegramUsername)
    ? normalizedTelegramUsername
    : null;

  return <RepairMoscowDemo telegramUsername={telegramUsername} />;
}
