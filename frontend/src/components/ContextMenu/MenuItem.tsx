import React, { useRef, useCallback } from 'react';
import { ContextMenuItem } from './types';
import { useContextMenu } from './ContextMenuProvider';
import { MdChevronRight } from 'react-icons/md';


interface MenuItemProps {
  item: ContextMenuItem;
  onItemClick: (item: ContextMenuItem) => void;
  level?: number;
}

export default function MenuItem({ item, onItemClick, level = 0 }: MenuItemProps) {
  const { state, showSubmenu, hideSubmenu } = useContextMenu();
  const itemRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>(null);
  
  const isSubmenuOpen = Boolean(state.submenuStates[item.id]?.isOpen);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (item.submenu && item.submenu.length > 0) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (itemRef.current) {
          const rect = itemRef.current.getBoundingClientRect();
          showSubmenu(item.id, rect.right + 4, rect.top);
        }
      }, 200);
    }
  }, [item.id, item.submenu, showSubmenu]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    if (isSubmenuOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        hideSubmenu(item.id);
      }, 3000);
    }
  }, [item.id, isSubmenuOpen, hideSubmenu]);

  const handleClick = useCallback(() => {
    if (item.submenu && item.submenu.length > 0) {
      if (isSubmenuOpen) {
        hideSubmenu(item.id);
      } else if (itemRef.current) {
        const rect = itemRef.current.getBoundingClientRect();
        showSubmenu(item.id, rect.right + 4, rect.top);
      }
    } else if (item.onClick && !item.disabled) {
      onItemClick(item);
    }
  }, [item, isSubmenuOpen, showSubmenu, hideSubmenu, onItemClick]);

  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (item.separator && !item.label) {
    return <div className="border-t border-gray-600 my-1" />;
  }

  const hasSubmenu = item.submenu && item.submenu.length > 0;

  return (
    <>
      <button
        ref={itemRef}
        className={`
          w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
          ${item.disabled 
            ? 'opacity-50 cursor-not-allowed text-gray-400' 
            : `${item.color || 'text-white'} ${item.hoverColor || 'hover:bg-amethyst/20'} focus:bg-amethyst/20`
          }
          ${isSubmenuOpen ? 'bg-amethyst/20' : ''}
        `}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={item.disabled}
        role="menuitem"
        aria-haspopup={hasSubmenu ? 'menu' : undefined}
        aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
        tabIndex={item.disabled ? -1 : 0}
      >
        <div className="flex items-center gap-3">
          {item.icon && (
            <item.icon className="text-lg shrink-0" />
          )}
          <span>{item.label}</span>
        </div>
        
        {/* Submenu indicator */}
        {hasSubmenu && (
          <MdChevronRight className="text-sm text-gray-400" />
        )}
      </button>
      
      {/* Separator after item if specified */}
      {item.separator && <div className="border-t border-gray-600 my-1" />}
    </>
  );
}