import type { Dispatch, SetStateAction } from 'react';
import { Bell, Check, Sparkles } from 'lucide-react';

type WorkspacePreferenceState = {
  warmTheme: boolean;
  weeklyDigest: boolean;
  dueReminders: boolean;
  attendanceNudge: boolean;
};

export default function WorkspacePreferences({
  preferences,
  setPreferences,
}: {
  preferences: WorkspacePreferenceState;
  setPreferences: Dispatch<SetStateAction<WorkspacePreferenceState>>;
}) {
  return (
    <div className="workspace-preferences">
      <div id="settings-appearance" className="settings-preference-section">
        <div className="settings-preference-heading">
          <span className="settings-preference-icon"><Sparkles size={16} /></span>
          <div><strong>Make this space feel like yours.</strong><small>Choose the paper your classroom sits on.</small></div>
        </div>
        <div className="appearance-choices">
          <button type="button" className={`appearance-choice ${!preferences.warmTheme ? 'appearance-selected' : ''}`} onClick={() => setPreferences((current) => ({ ...current, warmTheme: false }))}>
            <span className="theme-swatch swatch-meadow"><i /></span><span><strong>Quiet meadow</strong><small>Soft green · current</small></span>{!preferences.warmTheme && <Check size={15} />}
          </button>
          <button type="button" className={`appearance-choice ${preferences.warmTheme ? 'appearance-selected' : ''}`} onClick={() => setPreferences((current) => ({ ...current, warmTheme: true }))}>
            <span className="theme-swatch swatch-paper"><i /></span><span><strong>Warm paper</strong><small>Gentle peach · softer</small></span>{preferences.warmTheme && <Check size={15} />}
          </button>
        </div>
      </div>
      <div id="settings-notifications" className="settings-preference-section">
        <div className="settings-preference-heading">
          <span className="settings-preference-icon"><Bell size={16} /></span>
          <div><strong>A few gentle nudges.</strong><small>Choose which reminders belong in this sample workspace.</small></div>
        </div>
        <div className="preference-toggles">
          <label className="preference-toggle"><span><strong>A note about the week</strong><small>A small weekly classroom summary</small></span><input type="checkbox" checked={preferences.weeklyDigest} onChange={(event) => setPreferences((current) => ({ ...current, weeklyDigest: event.target.checked }))} /><i /></label>
          <label className="preference-toggle"><span><strong>Due-date reminders</strong><small>A heads-up when classwork is nearly due</small></span><input type="checkbox" checked={preferences.dueReminders} onChange={(event) => setPreferences((current) => ({ ...current, dueReminders: event.target.checked }))} /><i /></label>
          <label className="preference-toggle"><span><strong>Attendance check-in</strong><small>A friendly nudge when a class still needs one</small></span><input type="checkbox" checked={preferences.attendanceNudge} onChange={(event) => setPreferences((current) => ({ ...current, attendanceNudge: event.target.checked }))} /><i /></label>
        </div>
        <div className="preference-saved"><Check size={13} /> Preferences save automatically on this device.</div>
      </div>
    </div>
  );
}
