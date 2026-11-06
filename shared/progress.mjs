// This public contract contains no database configuration or credentials.
export const projectPaths = ['/gig.js', '/validate.js', '/publish.js', '/browse.js', '/apply.js', '/review.js'];
export const stages = [1, 2, 3, 4, 5, 6];
export const tokenPattern = /^[a-f0-9]{64}$/;
export const bodyLimit = 512 * 1024;
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

export function validWorkspace(value) {
  return exact(value, ['version', 'codeFiles', 'completed', 'attempts', 'currentLesson'])
    && value.version === 2 && stages.includes(value.currentLesson)
    && exact(value.codeFiles, projectPaths) && projectPaths.every(path => typeof value.codeFiles[path] === 'string' && value.codeFiles[path].length <= 50000)
    && Array.isArray(value.completed) && value.completed.length <= 6 && new Set(value.completed).size === value.completed.length && value.completed.every(id => stages.includes(id))
    && exact(value.attempts, stages.map(String)) && stages.every(id => Number.isSafeInteger(value.attempts[id]) && value.attempts[id] >= 0 && value.attempts[id] <= 1000000);
}

export function validWrite(value) {
  return exact(value, ['workspace', 'expectedRevision']) && validWorkspace(value.workspace)
    && Number.isSafeInteger(value.expectedRevision) && value.expectedRevision >= 0 && value.expectedRevision < Number.MAX_SAFE_INTEGER;
}

export function validProgress(value) {
  return exact(value, ['workspace', 'revision', 'createdAt', 'updatedAt']) && validWorkspace(value.workspace)
    && Number.isSafeInteger(value.revision) && value.revision > 0
    && [value.createdAt, value.updatedAt].every(date => typeof date === 'string' && date.length <= 30 && Number.isFinite(Date.parse(date)));
}

// Stable order avoids requests caused only by a different JSON property order.
export function workspaceText(value) {
  return JSON.stringify({ version: value.version, codeFiles: Object.fromEntries(projectPaths.map(path => [path, value.codeFiles[path]])), completed: [...value.completed].sort(), attempts: Object.fromEntries(stages.map(id => [id, value.attempts[id]])), currentLesson: value.currentLesson });
}
