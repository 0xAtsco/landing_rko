import { NextResponse } from "next/server";

export const runtime = "nodejs";

const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;

type Application = {
  stage?: unknown;
  leadId?: unknown;
  tariff?: unknown;
  name?: unknown;
  telegram?: unknown;
  income?: unknown;
  readiness?: unknown;
};

function isText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export async function POST(request: Request) {
  const webhookUrl = process.env.APPLICATIONS_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({ error: "Приём заявок ещё настраивается. Напиши Андрею в личные сообщения." }, { status: 503 });
  }

  let application: Application;
  try {
    application = await request.json();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать заявку. Попробуй ещё раз." }, { status: 400 });
  }

  const stage = typeof application.stage === "string" ? application.stage.trim() : "";
  const leadId = typeof application.leadId === "string" ? application.leadId.trim() : "";
  const tariff = typeof application.tariff === "string" ? application.tariff.trim() : "";
  const name = typeof application.name === "string" ? application.name.trim() : "";
  const telegramRaw = typeof application.telegram === "string" ? application.telegram.trim() : "";
  const income = typeof application.income === "string" ? application.income.trim() : "";
  const readiness = Number(application.readiness);

  const hasValidContact = ["contact", "details"].includes(stage) && isText(leadId, 80) && isText(tariff, 80) && isText(name, 120) && telegramPattern.test(telegramRaw);
  const hasValidDetails = stage !== "details" || (isText(income, 120) && Number.isInteger(readiness) && readiness >= 1 && readiness <= 10);
  if (!hasValidContact || !hasValidDetails) {
    return NextResponse.json({ error: "Проверь заполненные поля и попробуй ещё раз." }, { status: 400 });
  }

  try {
    const payload = JSON.stringify({
      token: process.env.APPLICATIONS_WEBHOOK_SECRET || undefined,
      submittedAt: new Date().toISOString(),
      stage,
      leadId,
      tariff,
      name,
      telegram: telegramRaw,
      income,
      readiness,
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });

    // Apps Script completes doPost and then sends its ContentService response through
    // a googleusercontent.com redirect. The redirect itself is the successful result.
    const acceptedByAppsScript = response.status >= 300 && response.status < 400;
    if (!response.ok && !acceptedByAppsScript) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  } catch (error) {
    console.error("Application webhook failed", error);
    return NextResponse.json({ error: "Не удалось сохранить заявку. Попробуй ещё раз или напиши Андрею." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
