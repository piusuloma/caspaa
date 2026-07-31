import React from 'react';

export function ChatBubble({ children, mine = false }) {
  return <div className={'bubble ' + (mine ? 'mine' : 'theirs')}>{children}</div>;
}
