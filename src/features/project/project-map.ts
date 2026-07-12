import type { Project } from "@/types/project";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/validation/project";

// ── Database row ──────────────────────────────────────────

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  technologies: string[];
  live_url: string | null;
  playstore_url: string | null;
  appstore_url: string | null;
  git_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

// ── Explicit column selection ──────────────────────────────

export const PROJECT_COLUMNS =
  "id, user_id, title, description, technologies, live_url, playstore_url, appstore_url, git_url, image_url, created_at, updated_at";

// ── Row → domain ──────────────────────────────────────────

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    technologies: row.technologies ?? [],
    liveUrl: row.live_url,
    playstoreUrl: row.playstore_url,
    appstoreUrl: row.appstore_url,
    gitUrl: row.git_url,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── Domain → insert row ───────────────────────────────────

export type ProjectInsertRow = {
  user_id: string;
  title: string;
  description: string;
  technologies: string[];
  live_url?: string | null;
  playstore_url?: string | null;
  appstore_url?: string | null;
  git_url?: string | null;
  image_url?: string | null;
};

export function toProjectInsert(
  input: CreateProjectInput,
  userId: string,
): ProjectInsertRow {
  return {
    user_id: userId,
    title: input.title,
    description: input.description,
    technologies: input.technologies ?? [],
    ...(input.liveUrl !== undefined && { live_url: input.liveUrl }),
    ...(input.playstoreUrl !== undefined && {
      playstore_url: input.playstoreUrl,
    }),
    ...(input.appstoreUrl !== undefined && { appstore_url: input.appstoreUrl }),
    ...(input.gitUrl !== undefined && { git_url: input.gitUrl }),
    ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
  };
}

// ── Domain → update row ───────────────────────────────────

export type ProjectUpdateRow = {
  title?: string;
  description?: string;
  technologies?: string[];
  live_url?: string | null;
  playstore_url?: string | null;
  appstore_url?: string | null;
  git_url?: string | null;
  image_url?: string | null;
};

export function toProjectUpdate(
  input: UpdateProjectInput,
): ProjectUpdateRow {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.technologies !== undefined && {
      technologies: input.technologies,
    }),
    ...(input.liveUrl !== undefined && { live_url: input.liveUrl }),
    ...(input.playstoreUrl !== undefined && {
      playstore_url: input.playstoreUrl,
    }),
    ...(input.appstoreUrl !== undefined && { appstore_url: input.appstoreUrl }),
    ...(input.gitUrl !== undefined && { git_url: input.gitUrl }),
    ...(input.imageUrl !== undefined && { image_url: input.imageUrl }),
  };
}
