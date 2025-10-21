import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useContextMenu } from './ContextMenuProvider';


export default function ContextMenu() {
  const { state, hideMenu } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * React Concept: useEffect for Side Effects and Cleanup
   * 
   * This effect handles:
   * - Outside click detection
   * - Keyboard navigation (Escape key)
   * - Window resize adjustments
   * - Scroll event handling
   * - Proper cleanup to prevent memory leaks
   */
  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideMenu();
      }
    };

    const handleScroll = () => {
      hideMenu();
    };

    const handleResize = () => {
      hideMenu();
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    // Cleanup function - critical for preventing memory leaks
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.isOpen, hideMenu]);

  /** 
   * This function calculates optimal menu position to ensure
   * the menu stays within viewport boundaries.
   */
  const getMenuPosition = () => {
    if (!state.isOpen || !state.config) return {};

    const { x, y } = state.position;
    const menuWidth = 200; // Approximate menu width
    const menuHeight = (state.config.items.length * 40) + 16; // Approximate height

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position adjustments
    let adjustedX = x;
    let adjustedY = y;

    // Prevent menu from going off-screen horizontally
    if (x + menuWidth > viewportWidth) {
      adjustedX = viewportWidth - menuWidth - 10;
    }

    // Prevent menu from going off-screen vertically
    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 10;
    }

    // Ensure minimum distance from edges
    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    return {
      position: 'fixed' as const,
      left: adjustedX,
      top: adjustedY,
      zIndex: 9999,
    };
  };

  if (!state.isOpen || !state.config) {
    return null;
  }

  const menuContent = (
    <div
      ref={menuRef}
      className="bg-shadow border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-48"
      style={getMenuPosition()}
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1">
        {state.config.items.map((item, index) => (
          <React.Fragment key={item.id}>
            <button
              className={`
                w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3
                ${item.disabled 
                  ? 'opacity-50 cursor-not-allowed text-gray-400' 
                  : `${item.color || 'text-white'} hover:bg-amethyst/20 focus:bg-amethyst/20`
                }
              `}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  hideMenu();
                }
              }}
              disabled={item.disabled}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
            >
              {item.icon && (
                <item.icon className="text-lg shrink-0" />
              )}
              <span>{item.label}</span>
            </button>
            
            {/* Separator */}
            {item.separator && index < state.config!.items.length - 1 && (
              <div className="border-t border-gray-600 my-1" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return createPortal(menuContent as React.ReactNode, document.body);
}