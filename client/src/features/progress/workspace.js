import { editablePaths, starterFiles } from '../lab/project.js';
import { checkIds } from '../lab/checks.js';

export const storageKey = 'giglink-prep.workspace.v1';
export function freshWorkspace() {
  return { version: 1, codeFiles: { ...starterFiles }, completed: [], attempts: { 1: 0, 2: 0, 3: 0 }, currentLesson: 1 };
}

export function readWorkspace(storage) {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return { workspace: freshWorkspace(), message: 'Work saves on this device as you edit.' };
    const value = JSON.parse(raw);
    const valid = value.version === 1 && value.codeFiles && editablePaths.every((path) => typeof value.codeFiles[path] === 'string' && value.codeFiles[path].length <= 50000)
      && Array.isArray(value.completed) && value.completed.every((id) => [1, 2, 3].includes(id))
      && [1, 2, 3].includes(value.currentLesson) && value.attempts && [1, 2, 3].every((id) => Number.isSafeInteger(value.attempts[id]) && value.attempts[id] >= 0);
    if (!valid) throw new Error('Unsupported saved workspace');
    return {
      workspace: { version: 1, codeFiles: Object.fromEntries(editablePaths.map((path) => [path, value.codeFiles[path]])), completed: [...new Set(value.completed)], attempts: value.attempts, currentLesson: value.currentLesson },
      message: 'Saved on this device · restored your work.',
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
    const ids = [1, 2, 3].filter((stage) => stage <= id).flatMap((stage) => checkIds[stage]);
    const passed = ids.every((key) => checks.some((check) => check.id === key && check.passed === true));
    if (passed) result.completed = [...new Set([...result.completed, id])].sort();
    else result.completed = result.completed.filter((stage) => stage < id);
  }
  return result;
}
