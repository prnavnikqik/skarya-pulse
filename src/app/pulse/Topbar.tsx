import React from 'react';

export const Topbar = ({ 
  currentTitle, 
  navTo, 
  showBackBtn, 
  selectedModel,
  onModelSelect,
  isModelDropdownOpen,
  toggleModelDropdown,
  newSession,
  fetchChats,
  AVAILABLE_MODELS
}: any) => {
  return (
    <div className="topbar">
      <button 
        className={`backbtn ${showBackBtn ? 'vis' : ''}`} 
        onClick={() => navTo('standup')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Standup History
      </button>
      <span className="ttl">{currentTitle}</span>
      <div className={`mpill ${isModelDropdownOpen ? 'open' : ''}`} onClick={toggleModelDropdown}>
        <span className="sp">✦</span><span>{selectedModel.name}</span>
        <svg className="cv" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        
        <div className={`mdd ${isModelDropdownOpen ? 'vis' : ''}`}>
          {AVAILABLE_MODELS.map((model: any) => (
             <div 
               key={model.id}
               className={`dopt ${selectedModel.id === model.id ? 'sel' : ''}`} 
               onClick={(e) => {
                 e.stopPropagation();
                 onModelSelect(model);
               }}
             >
               <span className="ddot" style={{ background: model.color }}></span>
               {model.name}
               <span className="dtag">{model.badge}</span>
             </div>
          ))}
        </div>
      </div>
      <button className="nbtn" style={{ marginLeft: '10px' }} onClick={fetchChats}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        History
      </button>
      <button className="nbtn" onClick={newSession}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Session
      </button>
    </div>
  );
};
