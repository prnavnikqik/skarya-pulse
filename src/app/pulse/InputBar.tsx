import React from 'react';

export const InputBar = ({
  input,
  setInput,
  handleSend,
  busy,
  activeCtx,
  fillInput
}: any) => {

  const TOOLBAR_HOME = [
    { label:'Summarise', icon:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>, prompt:'Summarise this session and extract all action items.' },
    { label:'Report',    icon:<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>, prompt:'Draft a sprint report.' },
    { label:'Blockers',  icon:<><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>, prompt:'What are all active blockers and your recommended resolutions?' },
  ];
  
  const TOOLBAR_STANDUP = [
    { label:'Wrap Up',   icon:<><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>, prompt:'Wrap up the standup and give a full round-by-round summary.' },
    { label:'Blockers',  icon:<><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>, prompt:'What blockers were raised in this standup and what are your suggested fixes?' },
    { label:'Actions',   icon:<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>, prompt:'Extract all action items from this standup so I can create tasks.' },
  ];

  const btns = activeCtx === 'standup' ? TOOLBAR_STANDUP : TOOLBAR_HOME;

  const onKeyDown = (e: any) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ibar">
      <div className="ibox">
        <div className="irow">
          <textarea 
            className="ifield" 
            id="inp" 
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={activeCtx === 'standup' ? 'Continue standup...' : 'Ask Pulse anything...'}
          />
        </div>
        <div className="ifoot">
          <div className="ibtns" id="ibtns">
            {btns.map((b, i) => (
              <button key={i} className="ibtn" onClick={() => fillInput(b.prompt)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {b.icon}
                </svg>
                {b.label}
              </button>
            ))}
          </div>
          <div className="iright">
            <span className="charc">{input.length}/1500</span>
            <button className={`sendbtn ${busy ? 'busy' : ''}`} onClick={handleSend} disabled={busy}>
              {busy ? (
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <path d="M12 2A10 10 0 1 0 22 12" />
                 </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="discl">Pulse may make mistakes — verify critical decisions with your team.</div>
    </div>
  );
};
