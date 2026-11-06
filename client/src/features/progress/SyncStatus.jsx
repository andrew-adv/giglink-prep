import { useWorkspace } from './WorkspaceProvider.jsx';
import './sync.css';

function download(value, name) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SyncStatus() {
  const { workspace, saveStatus, syncState, resolveConflict, retrySync } = useWorkspace();
  const { status, message, conflict, recovery } = syncState;
  return <section className={`progress-sync ${status}`} aria-label="Progress saving">
    <p role="status">{saveStatus.startsWith('Not saved') ? saveStatus : message}</p>
    {status === 'waiting' && <button className="button secondary" onClick={retrySync}>Try sync now</button>}
    {conflict && <div className="sync-conflict">
      <h2>Choose which work to continue with</h2>
      <p>Your device has {workspace.completed.length}/6 lessons checked. {conflict.progress ? `The server has ${conflict.progress.workspace.completed.length}/6, saved ${new Date(conflict.progress.updatedAt).toLocaleString()}.` : 'The earlier server copy is missing.'} Code can differ even when these counts match.</p>
      <p>Keeping this device sends its current work to the server after a revision check. Loading the server replaces the open workspace. Both earlier copies stay in a recovery backup on this device.</p>
      <div className="sync-actions">
        <button className="button secondary" onClick={() => download(workspace, 'giglink-prep-device.json')}>Download device copy</button>
        {conflict.progress && <button className="button secondary" onClick={() => download(conflict.progress.workspace, 'giglink-prep-server.json')}>Download server copy</button>}
        <button className="button primary" onClick={() => resolveConflict('local')}>Keep device version</button>
        {conflict.progress && <button className="button secondary" onClick={() => resolveConflict('remote')}>Load server version</button>}
      </div>
    </div>}
    <details><summary>About anonymous saving{recovery ? ' and recovery copies' : ''}</summary>
      <p>No signup is needed. This browser keeps a secret learner token. Anyone who obtains it can read or replace your saved work. Use fictional data, keep the token private, and do not paste it into chats or screenshots. Clearing browser storage loses this device’s token and access to its server copy.</p>
      {recovery && <button className="button secondary" onClick={() => download(recovery, 'giglink-prep-recovery.json')}>Download earlier conflict copies</button>}
    </details>
  </section>;
}
