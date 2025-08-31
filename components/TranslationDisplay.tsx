
import React, { useRef, useState, useEffect } from 'react';
import type { TranslatedBlock } from '../types';

interface TranslationDisplayProps {
  originalImage: string | null;
  translatedData: TranslatedBlock[] | null;
}

interface PopoverState {
  block: TranslatedBlock;
  style: React.CSSProperties;
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({ originalImage, translatedData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageRect, setImageRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [hoveredBlock, setHoveredBlock] = useState<PopoverState | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container) return;

    const updateRect = () => {
      if (image.naturalWidth > 0) {
        setImageRect({
          top: image.offsetTop,
          left: image.offsetLeft,
          width: image.offsetWidth,
          height: image.offsetHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(container);

    image.onload = updateRect;
    if (image.complete) {
      updateRect();
    }

    return () => {
      resizeObserver.disconnect();
      image.onload = null;
    };
  }, [originalImage]);
  
  const handleMouseEnter = (block: TranslatedBlock) => {
    const { boundingBox } = block;

    const popoverStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${boundingBox.x}%`,
      top: `${boundingBox.y + boundingBox.height}%`,
      transform: 'translateY(8px)',
      zIndex: 20,
    };

    // If the box is in the lower half of the image, place popover above it
    if (boundingBox.y + boundingBox.height > 70) { // 70% threshold
        popoverStyle.top = `${boundingBox.y}%`;
        popoverStyle.transform = 'translateY(-100%) translateY(-8px)';
    }

    setHoveredBlock({ block, style: popoverStyle });
  };

  const handleMouseLeave = () => {
    setHoveredBlock(null);
  };


  if (!originalImage) {
    return (
      <div className="text-gray-500 text-center">
        <p>Your translated document will appear here.</p>
        <p className="text-sm">Start by uploading a file.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      <img
        ref={imageRef}
        src={originalImage}
        alt="Original document"
        className="max-w-full max-h-full object-contain rounded-lg"
      />
      {translatedData && imageRect.height > 0 && (
        <div
          className="absolute"
          style={{
            top: `${imageRect.top}px`,
            left: `${imageRect.left}px`,
            width: `${imageRect.width}px`,
            height: `${imageRect.height}px`,
          }}
        >
          {translatedData.map((block, index) => {
            const { boundingBox, translatedText } = block;
            
            const style: React.CSSProperties = {
              position: 'absolute',
              left: `${boundingBox.x}%`,
              top: `${boundingBox.y}%`,
              width: `${boundingBox.width}%`,
              height: `${boundingBox.height}%`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#111827', // bg-gray-900
              color: 'white',
              boxSizing: 'border-box',
              cursor: 'pointer',
              borderRadius: '2px',
            };
            
            return (
              <div
                key={index}
                style={style}
                className="group"
                onMouseEnter={() => handleMouseEnter(block)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="absolute inset-0 bg-cyan-500 opacity-0 group-hover:opacity-25 transition-opacity duration-200 rounded-[1px]"></div>
                 <span className="text-xs text-center truncate px-1">{translatedText}</span>
              </div>
            );
          })}
          
          {hoveredBlock && (
            <div
              style={hoveredBlock.style}
              className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-2xl max-w-xs w-max"
            >
                <div className="space-y-2">
                    <div>
                        <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">Original</p>
                        <p className="text-sm text-gray-300 italic" style={{wordBreak: 'break-word'}}>{hoveredBlock.block.originalText}</p>
                    </div>
                    <div className="border-t border-gray-700"></div>
                    <div>
                        <p className="text-xs text-cyan-400 font-bold tracking-wider uppercase mb-1">Translation</p>
                        <p className="text-sm text-white font-medium" style={{wordBreak: 'break-word'}}>{hoveredBlock.block.translatedText}</p>
                    </div>
                </div>
            </div>
           )}
        </div>
      )}
    </div>
  );
};
