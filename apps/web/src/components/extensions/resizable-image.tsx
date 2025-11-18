import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeViewProps } from '@tiptap/core';
import { useState, useRef, useEffect } from 'react';
import { FaArrowsAlt } from 'react-icons/fa';

const ResizableImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    setResizeDirection(direction);
    startX.current = e.clientX;
    startY.current = e.clientY;

    const img = imgRef.current;
    if (img) {
      startWidth.current = img.offsetWidth;
      startHeight.current = img.offsetHeight;
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!imgRef.current) return;

      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;

      let newWidth = startWidth.current;
      let newHeight = startHeight.current;

      // Calculate new dimensions based on resize direction
      if (resizeDirection.includes('e')) {
        newWidth = startWidth.current + deltaX;
      } else if (resizeDirection.includes('w')) {
        newWidth = startWidth.current - deltaX;
      }

      if (resizeDirection.includes('s')) {
        newHeight = startHeight.current + deltaY;
      } else if (resizeDirection.includes('n')) {
        newHeight = startHeight.current - deltaY;
      }

      // Maintain aspect ratio if resizing from corners
      if (resizeDirection.length === 2) {
        const aspectRatio = startWidth.current / startHeight.current;
        newHeight = newWidth / aspectRatio;
      }

      // Set minimum size
      newWidth = Math.max(50, newWidth);
      newHeight = Math.max(50, newHeight);

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection('');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, updateAttributes]);

  const { src, alt, title, width, height } = node.attrs;

  return (
    <NodeViewWrapper className="resizable-image-wrapper inline-block relative group my-4" data-drag-handle>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        className={`rounded border-2 ${
          selected ? 'border-blue-500' : 'border-transparent'
        } transition-all`}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%',
          display: 'block',
        }}
      />

      {/* Drag handle - always visible on hover */}
      <div
        className={`absolute top-2 left-2 bg-blue-500 text-white p-1.5 rounded shadow-lg cursor-move ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-80'
        } transition-opacity`}
        data-drag-handle
        title="Перетащите для перемещения изображения"
      >
        <FaArrowsAlt className="w-3 h-3" />
      </div>

      {selected && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize -translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border border-white cursor-se-resize translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Edge handles */}
          <div
            className="absolute top-0 left-1/2 w-3 h-3 bg-blue-500 border border-white cursor-n-resize -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          <div
            className="absolute bottom-0 left-1/2 w-3 h-3 bg-blue-500 border border-white cursor-s-resize -translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          <div
            className="absolute top-1/2 left-0 w-3 h-3 bg-blue-500 border border-white cursor-w-resize -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          <div
            className="absolute top-1/2 right-0 w-3 h-3 bg-blue-500 border border-white cursor-e-resize translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />

          {/* Dimensions tooltip */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {width || 'auto'} × {height || 'auto'}
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  name: 'resizableImage',

  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
