import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { changeFiles, readWorkspace, recordChecks, saveWorkspace } from './workspace.js';

const WorkspaceContext = createContext(null);
function storage() { try { return window.localStorage; } catch { return null; } }

export function WorkspaceProvider({ children }) {
  const [initial] = useState(() => readWorkspace(storage()));
  const [workspace, setWorkspace] = useState(initial.workspace);
  const [saveStatus, setSaveStatus] = useState(initial.message);
  const changed = useRef(false);

  useEffect(() => {
    if (changed.current) setSaveStatus(saveWorkspace(storage(), workspace));
  }, [workspace]);

  const updateFiles = useCallback((files) => {
    setWorkspace((current) => {
      const next = changeFiles(current, files);
      if (next !== current) changed.current = true;
      return next;
    });
  }, []);
  const visitLesson = useCallback((id) => {
    setWorkspace((current) => {
      if (current.currentLesson === id) return current;
      changed.current = true;
      return { ...current, currentLesson: id };
    });
  }, []);
  const startAttempt = useCallback((id) => {
    changed.current = true;
    setWorkspace((current) => ({ ...current, attempts: { ...current.attempts, [id]: current.attempts[id] + 1 } }));
  }, []);
  const acceptChecks = useCallback((id, checks) => {
    changed.current = true;
    setWorkspace((current) => recordChecks(current, id, checks));
  }, []);

  return <WorkspaceContext.Provider value={{ workspace, saveStatus, updateFiles, visitLesson, startAttempt, acceptChecks }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { return useContext(WorkspaceContext); }
