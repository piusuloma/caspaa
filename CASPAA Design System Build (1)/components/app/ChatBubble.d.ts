import * as React from 'react';

/** Message bubble — .bubble.mine is navy on the right, .bubble.theirs is slate on the left.
 *  Used by Communications and the parent/teacher diary. */
export interface ChatBubbleProps {
  children?: React.ReactNode;
  mine?: boolean;
}

export function ChatBubble(props: ChatBubbleProps): JSX.Element;
