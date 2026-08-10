"use client";

import { useRef, useState } from "react";
import {
  Bath,
  Camera,
  Check,
  CircleAlert,
  HardHat,
  LockKeyhole,
  Palette,
  PieChart,
  Ruler,
  Send,
  ShoppingCart,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { repairMoscowDemoContent } from "@/lib/content";
import {
  clampRepairArea,
  type RepairType,
} from "@/lib/artifacts/repair-moscow-demo/calculator";
import {
  buildRepairTelegramDraft,
  buildTelegramDraftUrl,
} from "@/lib/artifacts/repair-moscow-demo/telegram";

type RepairDemoInteractiveProps = {
  telegramUsername: string | null;
};

type FormValues = {
  name: string;
  district: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const benefitIcons: Record<string, LucideIcon> = {
  cart: ShoppingCart,
  camera: Camera,
  chart: PieChart,
  hardhat: HardHat,
};

const repairTypeLabels: Record<RepairType, string> = {
  cosmetic: "косметический",
  capital: "капитальный",
  design: "дизайн + ремонт",
};

function copyTextSafely(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => fallbackCopy(text),
    );
  }

  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export function RepairDemoInteractive({ telegramUsername }: RepairDemoInteractiveProps) {
  const [area, setArea] = useState(45);
  const [repairType, setRepairType] = useState<RepairType>("capital");
  const [bathroom, setBathroom] = useState(true);
  const [designProject, setDesignProject] = useState(false);
  const [form, setForm] = useState<FormValues>({ name: "", district: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const districtInputRef = useRef<HTMLInputElement>(null);

  const isDesignIncluded = repairType === "design";

  function changeArea(nextArea: number) {
    setArea(clampRepairArea(nextArea));
    setStatus("");
  }

  function changeRepairType(nextType: RepairType) {
    setRepairType(nextType);
    setDesignProject(nextType === "design");
    setStatus("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Укажите имя";
    if (!form.district.trim()) nextErrors.district = "Укажите район";
    setErrors(nextErrors);
    if (nextErrors.name) nameInputRef.current?.focus();
    else if (nextErrors.district) districtInputRef.current?.focus();
    return Object.keys(nextErrors).length === 0;
  }

  function openTelegram() {
    if (!validateForm()) {
      setStatus("Проверьте заполнение формы.");
      return;
    }

    if (!telegramUsername) {
      setStatus("Telegram для заявок пока не настроен. Данные на сайте не сохраняются.");
      return;
    }

    const draft = buildRepairTelegramDraft({
      name: form.name.trim(),
      district: form.district.trim(),
      area,
      repairType: repairTypeLabels[repairType],
    });
    const telegramUrl = buildTelegramDraftUrl(telegramUsername, draft);

    if (!telegramUrl) {
      setStatus("Telegram для заявок пока не настроен. Данные на сайте не сохраняются.");
      return;
    }

    void copyTextSafely(draft).then((copied) => {
      setStatus(
        copied
          ? "Открываем Telegram. Текст заявки также скопирован — данные на сайте не сохраняются."
          : "Открываем Telegram с готовым текстом. Данные на сайте не сохраняются.",
      );
    });

    const telegramWindow = window.open(telegramUrl, "_blank");
    if (telegramWindow) {
      telegramWindow.opener = null;
    } else {
      window.location.assign(telegramUrl);
    }
  }

  return (
    <>
      <section className="repair-demo__calculator-section" id="calculator" aria-labelledby="calculator-title">
        <div className="repair-demo__section-heading">
          <p>Параметры обращения</p>
          <h2 id="calculator-title">Подберите параметры ремонта</h2>
        </div>
        <div className="repair-demo__calculator-grid">
          <div className="repair-demo__calculator-controls">
            <label className="repair-demo__control repair-demo__control--area">
              <span className="repair-demo__control-label"><Ruler aria-hidden="true" />Площадь</span>
              <span className="repair-demo__area-value">{area} м²</span>
              <input
                aria-label="Площадь квартиры в квадратных метрах"
                type="range"
                min="20"
                max="150"
                value={area}
                onChange={(event) => changeArea(Number(event.target.value))}
              />
              <input
                className="repair-demo__number-input"
                type="number"
                min="20"
                max="150"
                value={area}
                onChange={(event) => changeArea(Number(event.target.value))}
                onBlur={(event) => changeArea(Number(event.target.value))}
                aria-label="Точное значение площади"
              />
            </label>

            <label className="repair-demo__control">
              <span className="repair-demo__control-label"><Wrench aria-hidden="true" />Тип ремонта</span>
              <select value={repairType} onChange={(event) => changeRepairType(event.target.value as RepairType)}>
                <option value="cosmetic">Косметический</option>
                <option value="capital">Капитальный</option>
                <option value="design">Дизайн + ремонт</option>
              </select>
            </label>

            <label className="repair-demo__control repair-demo__control--toggle">
              <span className="repair-demo__control-label"><Bath aria-hidden="true" />Санузел</span>
              <span className="repair-demo__switch">
                <input
                  type="checkbox"
                  checked={bathroom}
                  onChange={(event) => {
                    setBathroom(event.target.checked);
                    setStatus("");
                  }}
                />
                <span aria-hidden="true" />
              </span>
              <b>{bathroom ? "Да" : "Нет"}</b>
            </label>

            <label className="repair-demo__control repair-demo__control--toggle">
              <span className="repair-demo__control-label"><Palette aria-hidden="true" />Дизайн-проект</span>
              <span className="repair-demo__switch">
                <input
                  type="checkbox"
                  checked={isDesignIncluded || designProject}
                  disabled={isDesignIncluded}
                  onChange={(event) => {
                    setDesignProject(event.target.checked);
                    setStatus("");
                  }}
                />
                <span aria-hidden="true" />
              </span>
              <b>{isDesignIncluded ? "Включён" : designProject ? "Да" : "Нет"}</b>
            </label>
          </div>

          <aside className="repair-demo__estimate">
            <p>Следующий шаг</p>
            <strong>Обсудить расчёт</strong>
            <span className="repair-demo__estimate-copy">Уточним детали в Telegram и подготовим расчёт по вашей задаче.</span>
            <a className="repair-demo__button repair-demo__button--primary repair-demo__button--wide" href="#lead-form">
              Перейти в Telegram
            </a>
            <small><LockKeyhole size={14} aria-hidden="true" />Данные не сохраняются на сайте</small>
          </aside>
        </div>
      </section>

      <section className="repair-demo__benefits" aria-label="Преимущества">
        {repairMoscowDemoContent.benefits.map((benefit) => {
          const Icon = benefitIcons[benefit.icon] ?? Check;
          return (
            <div className="repair-demo__benefit" key={benefit.text}>
              <Icon aria-hidden="true" />
              <span>{benefit.text}</span>
            </div>
          );
        })}
      </section>

      <section className="repair-demo__process repair-demo__section" aria-labelledby="process-title">
        <div className="repair-demo__section-heading">
          <p>Как начать</p>
          <h2 id="process-title">Как начинается работа</h2>
        </div>
        <div className="repair-demo__process-grid">
          {repairMoscowDemoContent.process.map((step) => (
            <article className="repair-demo__process-card" key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="repair-demo__lead-form" id="lead-form" aria-labelledby="lead-form-title">
        <div className="repair-demo__form-heading">
          <h2 id="lead-form-title">Оставьте заявку в Telegram</h2>
          <span>Уточним детали по вашей задаче</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            openTelegram();
          }}
          noValidate
        >
          <div className="repair-demo__form-fields">
            <label>
              <span>Имя</span>
              <input
                ref={nameInputRef}
                name="name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "repair-name-error" : undefined}
                placeholder="Имя"
              />
              {errors.name && <small id="repair-name-error">{errors.name}</small>}
            </label>
            <label>
              <span>Район</span>
              <input
                ref={districtInputRef}
                name="district"
                value={form.district}
                onChange={(event) => {
                  setForm((current) => ({ ...current, district: event.target.value }));
                  setErrors((current) => ({ ...current, district: undefined }));
                }}
                aria-invalid={Boolean(errors.district)}
                aria-describedby={errors.district ? "repair-district-error" : undefined}
                placeholder="Район"
              />
              {errors.district && <small id="repair-district-error">{errors.district}</small>}
            </label>
            <label>
              <span>Площадь, м²</span>
              <input
                type="number"
                min="20"
                max="150"
                value={area}
                onChange={(event) => changeArea(Number(event.target.value))}
                onBlur={(event) => changeArea(Number(event.target.value))}
              />
            </label>
            <label>
              <span>Тип ремонта</span>
              <select value={repairType} onChange={(event) => changeRepairType(event.target.value as RepairType)}>
                <option value="cosmetic">Косметический</option>
                <option value="capital">Капитальный</option>
                <option value="design">Дизайн + ремонт</option>
              </select>
            </label>
          </div>
          <button className="repair-demo__button repair-demo__button--primary repair-demo__button--submit" type="submit">
            <Send size={19} aria-hidden="true" />
            Написать в Telegram
          </button>
          <p className="repair-demo__form-note"><LockKeyhole size={14} aria-hidden="true" />Данные не сохраняются на сайте</p>
          {!telegramUsername && (
            <p className="repair-demo__form-config" role="status">
              <CircleAlert size={15} aria-hidden="true" />Telegram для заявок пока не настроен. Данные на сайте не сохраняются.
            </p>
          )}
          {status && <p className="repair-demo__form-status" role="status">{status}</p>}
        </form>
      </section>

      <a className="repair-demo__mobile-cta" href="#lead-form">
        <Send aria-hidden="true" />
        <span><b>Расчёт в Telegram</b><small>Уточним детали по вашей задаче</small></span>
      </a>
    </>
  );
}
