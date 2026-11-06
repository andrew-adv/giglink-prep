import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { changeFiles, readWorkspace, recordChecks, saveWorkspace } from './workspace.js';
import { createProgressSync } from './sync.js';

const WorkspaceContext = createContext(null);
function storage() { try { return window.localStorage; } catch { return null; } }

export function WorkspaceProvider({ children, syncOptions = {} }) {
  const [initial] = useState(() => readWorkspace(storage()));
  const [workspace, setWorkspace] = useState(initial.workspace);
  const [saveStatus, setSaveStatus] = useState(initial.message);
  const changed = useRef(false);
  const current = useRef(workspace);
  current.current = workspace;
  const synchronizer = useRef(null);
  const [syncState, setSyncState] = useState({ status: 'local', message: 'Saved on this device', conflict: null, recovery: null });
  const [workspaceEpoch, setWorkspaceEpoch] = useState(0);
  const initialOptions = useRef(syncOptions);
  const editorActive = useRef(false);
  const setEditorActive = useCallback(active => { editorActive.current = active; }, []);

  useEffect(() => {
    const sync = createProgressSync({
      storage: storage(), crypto: window.crypto,
      getWorkspace: () => current.current,
      canAutoLoad: () => !editorActive.current,
      replaceWorkspace: (next) => {
        // Remote hydration must also refresh an already-open editor, not its stale files.
        const message = saveWorkspace(storage(), next);
        setSaveStatus(message);
        if (message.startsWith('Not saved')) return false;
        current.current = next;
        setWorkspace(next);
        setWorkspaceEpoch(epoch => epoch + 1);
        return true;
      },
      onState: setSyncState,
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      ...initialOptions.current,
    });
    synchronizer.current = sync;
    sync.start();
    const reconnect = () => sync.retry();
    window.addEventListener('online', reconnect);
    return () => { window.removeEventListener('online', reconnect); sync.stop(); synchronizer.current = null; };
  }, []);

  useEffect(() => {
    if (changed.current) {
      changed.current = false;
      setSaveStatus(saveWorkspace(storage(), workspace));
      synchronizer.current?.changed();
    }
  }, [workspace]);

  const changeWorkspace = useCallback((transform) => {
    const next = transform(current.current);
    if (next === current.current) return;
    // Make pending edits visible to an in-flight hydration before React commits.
    current.current = next;
    changed.current = true;
    setWorkspace(next);
  }, []);
  const updateFiles = useCallback(files => changeWorkspace(work => changeFiles(work, files)), [changeWorkspace]);
  const visitLesson = useCallback((id) => {
    changeWorkspace((current) => {
      if (current.currentLesson === id) return current;
      return { ...current, currentLesson: id };
    });
  }, [changeWorkspace]);
  const startAttempt = useCallback((id) => {
    changeWorkspace((current) => ({ ...current, attempts: { ...current.attempts, [id]: current.attempts[id] + 1 } }));
  }, [changeWorkspace]);
  const acceptChecks = useCallback((id, checks) => {
    changeWorkspace((current) => recordChecks(current, id, checks));
  }, [changeWorkspace]);

  return <WorkspaceContext.Provider value={{ workspace, workspaceEpoch, setEditorActive, saveStatus, syncState, resolveConflict: choice => synchronizer.current?.resolve(choice), retrySync: () => synchronizer.current?.retry(), updateFiles, visitLesson, startAttempt, acceptChecks }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() { return useContext(WorkspaceContext); }
