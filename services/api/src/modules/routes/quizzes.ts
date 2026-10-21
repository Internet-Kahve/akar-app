import { and, eq } from "drizzle-orm";
import type { Db } from "../../db/client.ts";
import { quizAnswers, quizzes, sites } from "../../db/schema/index.ts";
import type { Tx } from "../../platform/idempotency.ts";

/** Public quiz shape. Built from an explicit column list: the answer key cannot leak through it. */
export type PlayableQuiz = {
  id: string;
  siteId: string;
  question: string;
  questionEn: string | null;
  options: string[];
  optionsEn: string[] | null;
  hint: string | null;
};

const playable = {
  id: quizzes.id,
  siteId: quizzes.siteId,
  question: quizzes.question,
  questionEn: quizzes.questionEn,
  options: quizzes.options,
  optionsEn: quizzes.optionsEn,
  hint: quizzes.hint,
};

const onPublishedSite = and(eq(sites.id, quizzes.siteId), eq(sites.status, "published"));

/** Quizzes of a published site, without answers. */
export async function playableQuizzes(db: Tx | Db, siteId: string): Promise<PlayableQuiz[]> {
  return db.select(playable).from(quizzes).innerJoin(sites, onPublishedSite).where(eq(quizzes.siteId, siteId)).orderBy(quizzes.id);
}

export async function playableQuiz(db: Tx | Db, quizId: string): Promise<PlayableQuiz | null> {
  const [row] = await db.select(playable).from(quizzes).innerJoin(sites, onPublishedSite).where(eq(quizzes.id, quizId));
  return row ?? null;
}

/**
 * Server-side answer check. The explanation (with its source and trust) is returned only for a
 * correct answer; the index of the right option is never returned. Null = no such playable quiz.
 */
export async function checkQuizAnswer(
  db: Tx | Db,
  quizId: string,
  choice: number,
): Promise<{ correct: boolean; explanation: string | null; sourceId: string | null; trust: string | null } | null> {
  const [row] = await db
    .select({ correctIndex: quizAnswers.correctIndex, explanation: quizzes.explanation, sourceId: quizzes.sourceId, trust: quizzes.trust })
    .from(quizzes)
    .innerJoin(sites, onPublishedSite)
    .innerJoin(quizAnswers, eq(quizAnswers.quizId, quizzes.id))
    .where(eq(quizzes.id, quizId));
  if (!row) return null;
  const correct = row.correctIndex === choice;
  return correct
    ? { correct, explanation: row.explanation, sourceId: row.sourceId, trust: row.trust }
    : { correct, explanation: null, sourceId: null, trust: null };
}
