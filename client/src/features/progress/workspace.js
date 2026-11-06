import { editablePaths, lessonIds, starterFiles } from '../lab/project.js';
import { checkIds } from '../lab/checks.js';

export const legacyStorageKey = 'giglink-prep.workspace.v1';
export const storageKey = 'giglink-prep.workspace.v2';
export function freshWorkspace() {
  return { version: 2, codeFiles: { ...starterFiles }, completed: [], attempts: Object.fromEntries(lessonIds.map(id => [id, 0])), currentLesson: 1 };
}

export function readWorkspace(storage) {
  try {
    const current = storage.getItem(storageKey);
    const raw = current ?? storage.getItem(legacyStorageKey);
    if (!raw) return { workspace: freshWorkspace(), message: 'Work saves on this device as you edit.' };
    const value = JSON.parse(raw);
    const migrating = current === null && value.version === 1;
    const ids = migrating ? [1, 2, 3] : lessonIds;
    const paths = migrating ? editablePaths.slice(0, 3) : editablePaths;
    const valid = (migrating || value.version === 2) && value.codeFiles && paths.every((path) => typeof value.codeFiles[path] === 'string' && value.codeFiles[path].length <= 50000)
      && Array.isArray(value.completed) && value.completed.every((id) => ids.includes(id))
      && ids.includes(value.currentLesson) && value.attempts && ids.every((id) => Number.isSafeInteger(value.attempts[id]) && value.attempts[id] >= 0);
    if (!valid) throw new Error('Unsupported saved workspace');
    return {
      workspace: { ...freshWorkspace(), codeFiles: { ...starterFiles, ...Object.fromEntries(paths.map(path => [path, value.codeFiles[path]])) }, completed: [...new Set(value.completed)], attempts: { ...freshWorkspace().attempts, ...Object.fromEntries(ids.map(id => [id, value.attempts[id]])) }, currentLesson: value.currentLesson },
      message: migrating ? 'Restored P1 work · added lessons 4–6. Your original P1 save is kept as a backup.' : 'Saved on this device · restored your work.',
    };
  } catch {
    return { workspace: freshWorkspace(), message: 'Could not read saved work. A fresh workspace is open; the old save is kept until you make a change.' };
  }
}

export function saveWorkspace(storage, workspace) {
  try {
    if (editablePaths.some((path) => workspace.codeFiles[path].length > 50000)) throw new Error('File too large');
    storage.setItem(storageKey, JSON.stringify(workspace));
    return 'Saved on this device';
  } catch {
    return 'Not saved · browser storage is unavailable/full, or a file exceeds 50,000 characters. Keep this tab open and copy your code.';
  }
}

export function changeFiles(workspace, files) {
  const changed = editablePaths.filter((path) => files[path] !== workspace.codeFiles[path]);
  if (!changed.length) return workspace;
  const firstChanged = Math.min(...changed.map((path) => editablePaths.indexOf(path) + 1));
  return { ...workspace, codeFiles: Object.fromEntries(editablePaths.map((path) => [path, files[path]])), completed: workspace.completed.filter((id) => id < firstChanged) };
}

export function recordChecks(workspace, through, checks) {
  let result = { ...workspace, completed: [...workspace.completed] };
  for (let id = 1; id <= through; id++) {
    const ids = lessonIds.filter((stage) => stage <= id).flatMap((stage) => checkIds[stage]);
    const passed = ids.every((key) => checks.some((check) => check.id === key && check.passed === true));
    if (passed) result.completed = [...new Set([...result.completed, id])].sort();
    else result.completed = result.completed.filter((stage) => stage < id);
  }
  return result;
}
