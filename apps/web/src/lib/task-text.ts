import type { SiteBadge, SiteTask } from "@akar/domain";
import type { Lang } from "./i18n";

const written = (text: string | null | undefined) => !!text?.trim();
/** An English list counts only item for item with the Turkish one (an option's place is its answer). */
const sameLength = (tr: string[], en: string[] | undefined): en is string[] =>
  !!en && en.length === tr.length && en.every(written);

/**
 * A task in the site language. English only when all of its visible texts have their English, so a task is never
 * half Turkish; `english: false` = the Turkish task as it is.
 */
export function taskInLang(task: SiteTask, lang: Lang): { task: SiteTask; english: boolean } {
  if (lang !== "en" || !written(task.titleEn) || !written(task.promptEn)) return { task, english: false };
  const { quiz, field } = task;
  if (quiz && !(sameLength(quiz.options, quiz.optionsEn) && sameLength(quiz.hints, quiz.hintsEn)))
    return { task, english: false };
  if (field && (!written(field.onSite.textEn) || (field.fromHome && !written(field.fromHome.textEn))))
    return { task, english: false };
  return {
    english: true,
    task: {
      ...task,
      title: task.titleEn!,
      prompt: task.promptEn!,
      ...(quiz && {
        quiz: { ...quiz, options: quiz.optionsEn!, hints: quiz.hintsEn!, wrongText: quiz.wrongTextEn?.trim() || quiz.wrongText },
      }),
      ...(field && {
        field: {
          onSite: { ...field.onSite, text: field.onSite.textEn! },
          fromHome: field.fromHome && { ...field.fromHome, text: field.fromHome.textEn! },
        },
      }),
    },
  };
}

/** A badge in the site language: English when both its title and its text have it. */
export function badgeInLang(badge: SiteBadge, lang: Lang): { badge: SiteBadge; english: boolean } {
  if (lang !== "en" || !written(badge.titleEn) || !written(badge.textEn)) return { badge, english: false };
  return { english: true, badge: { ...badge, title: badge.titleEn!, text: badge.textEn! } };
}

/** An answer text (after a right answer, a wrong one or a finished field task) in the site language. */
export function answerText(lang: Lang, tr: string | null, en: string | null | undefined): { text: string; english: boolean } {
  return lang === "en" && written(en) ? { text: en!.trim(), english: true } : { text: tr ?? "", english: false };
}
