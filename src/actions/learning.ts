"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** RLS guarantees a user only writes progress for themselves; lesson visibility requires enrollment. */
export async function setLessonDone(lessonId: string, slug: string, done: boolean) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return;

  const { data: lesson } = await supabase.from("course_lessons").select("id").eq("id", lessonId).maybeSingle();
  if (!lesson) return;

  if (done) {
    await supabase.from("lesson_progress").upsert({ user_id: userId, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
  } else {
    await supabase.from("lesson_progress").delete().eq("user_id", userId).eq("lesson_id", lessonId);
  }
  revalidatePath(`/cont/cursuri/${slug}`);
}
