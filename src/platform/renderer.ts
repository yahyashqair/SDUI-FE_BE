import { PlatformDB } from '../db/platform';
import type { Blueprint } from '../db/platform';

export const getAppBlueprint = (projectId: string): Blueprint | null => {
  const blueprint = PlatformDB.getActiveBlueprint(projectId);
  if (!blueprint) return null;
  return blueprint;
};

export const parseUISchema = (blueprint: Blueprint) => {
  try {
    return JSON.parse(blueprint.ui_schema);
  } catch (e) {
    console.error('Failed to parse UI schema', e);
    return null;
  }
};
