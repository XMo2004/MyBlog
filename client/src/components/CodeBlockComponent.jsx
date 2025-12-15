import React from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import Mermaid from './Mermaid';
import Quiz from './Quiz';

const CodeBlockComponent = ({ node, updateAttributes, extension }) => {
  const { language } = node.attrs;
  
  // Determine if we should show a preview
  const isMermaid = language === 'mermaid';
  const isQuiz = language === 'quiz';
  const showPreview = isMermaid || isQuiz;

  return (
    <NodeViewWrapper className="code-block-wrapper my-4 relative group">
      {/* Language Label */}
      <div className="absolute right-2 top-2 z-10 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded select-none pointer-events-none">
        {language || 'text'}
      </div>

      {/* The Code Editor */}
      <pre className="bg-muted/30 rounded-lg p-4 font-mono text-sm border border-border/50 overflow-x-auto">
        <NodeViewContent as="code" />
      </pre>

      {/* Live Preview Area */}
      {showPreview && (
        <div className="mt-2 p-4 border border-border rounded-lg bg-card shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Live Preview
          </div>
          <div className="preview-content overflow-auto">
            {isMermaid && (
              <Mermaid chart={node.textContent} />
            )}
            {isQuiz && (
              <Quiz data={node.textContent} />
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

export default CodeBlockComponent;
