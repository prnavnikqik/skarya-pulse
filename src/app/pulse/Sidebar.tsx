import React from 'react';

export const Sidebar = ({ 
    isSidebarCollapsed, 
    toggleSB, 
    activeView, 
    navTo,
    user
  }: any) => {

    // Get initials safely from user.userName
    const getInitials = (name: string) => {
      if (!name) return 'U';
      const parts = name.split(' ');
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const initials = user ? getInitials(user.userName) : 'U';
    const displayName = user?.userName || 'User';
    const displayRole = user?.userEmail || 'Member';

    return (
      <aside className={`sb ${isSidebarCollapsed ? 'col' : ''}`} id="sb">
        <div className="logo">
          <div className="lic">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#5b5ef4"/>
                  <stop offset="100%" stopColor="#a78bfa"/>
                </linearGradient>
                <linearGradient id="lg2" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fff" stopOpacity=".95"/>
                  <stop offset="100%" stopColor="#e0dbff" stopOpacity=".9"/>
                </linearGradient>
                <clipPath id="shieldClip">
                  <path d="M16 2L5 7v8c0 6.5 4.5 12.4 11 14 6.5-1.6 11-7.5 11-14V7L16 2z"/>
                </clipPath>
              </defs>
              <path d="M16 2L5 7v8c0 6.5 4.5 12.4 11 14 6.5-1.6 11-7.5 11-14V7L16 2z" fill="url(#lg1)"/>
              <path d="M16 4.5L7 8.8v6.2c0 5.2 3.6 9.9 9 11.2 5.4-1.3 9-6 9-11.2V8.8L16 4.5z" fill="white" fillOpacity=".08"/>
              <g clipPath="url(#shieldClip)">
                <polyline points="4,16 9,16 11,11 13,21 15,13 17,19 19,16 28,16" stroke="url(#lg2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </g>
              <circle cx="15" cy="13" r="1.4" fill="white" opacity=".9"/>
            </svg>
          </div>
          <div className="lname">
            <div className="lname-top">Skarya <span>Pulse</span></div>
            <div className="lname-sub">AI Standup Intelligence</div>
          </div>
          <button className="tglbtn" id="tglbtn" onClick={toggleSB} title="Toggle sidebar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2.5"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <polyline points="13 9 17 12 13 15" strokeWidth="1.8"/>
            </svg>
          </button>
        </div>
        <div className="ss">
          <div className="slbl">Pulse</div>
          <div className={`ni ${activeView === 'home' ? 'act' : ''}`} data-tip="Ask Pulse" onClick={() => navTo('home')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            <span className="nl">Ask Pulse</span>
          </div>
          <div className={`ni ${activeView === 'standup' || activeView === 'standup-chat' ? 'act' : ''}`} data-tip="Daily Standup" onClick={() => navTo('standup')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <span className="nl">Daily Standup</span>
            <span className="badge bam">Today</span>
          </div>
          <div className={`ni ${activeView === 'summaries' ? 'act' : ''}`} data-tip="Summaries" onClick={() => navTo('summaries')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span className="nl">Summaries</span>
          </div>
          <div className={`ni ${activeView === 'reports' ? 'act' : ''}`} data-tip="Sprint Reports" onClick={() => navTo('reports')}>
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
             <span className="nl">Sprint Reports</span>
          </div>
          <div className={`ni ${activeView === 'analytics' ? 'act' : ''}`} data-tip="Team Analytics" onClick={() => navTo('analytics')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span className="nl">Team Analytics</span>
          </div>
          <div className={`ni ${activeView === 'blockers' ? 'act' : ''}`} data-tip="Blocker Radar" onClick={() => navTo('blockers')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            <span className="nl">Blocker Radar</span>
          </div>
        </div>
        <div className="ubottom">
          <div className="ucard">
            <div className="uav">{initials}</div>
            <div className="uinfo">
              <div className="uname">{displayName}</div>
              <div className="urole">{displayRole}</div>
            </div>
            <div className="uicons">
              <button className={`uico ${activeView === 'integrations' ? 'act' : ''}`} onClick={() => navTo('integrations')} title="Integrations">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </button>
              <button className={`uico ${activeView === 'settings' ? 'act' : ''}`} onClick={() => navTo('settings')} title="Settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
};
