import { useRef, useCallback, useState, useEffect } from 'react';
import { ContextMenuItem } from './types';
import { MdChevronRight } from 'react-icons/md';

interface MenuItemProps {
  item: ContextMenuItem;
  onItemClick: (item: ContextMenuItem) => void;
  level?: number;
}

export default function MenuItem({ item, onItemClick, level = 0 }: MenuItemProps) {
  const itemRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState<'right' | 'left'>('right');
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (item.submenu && item.submenu.length > 0) {
      setIsSubmenuOpen(true);
    }
  }, [item.submenu]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    if (item.submenu && item.submenu.length > 0) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsSubmenuOpen(false);
      }, 150);
    }
  }, [item.submenu]);

  const handleClick = useCallback(() => {
    if (item.onClick && !item.disabled) {
      onItemClick(item);
    }
  }, [item, onItemClick]);

  useEffect(() => {
    if (isSubmenuOpen && itemRef.current && submenuRef.current) {
      const parentRect = itemRef.current.getBoundingClientRect();
      const submenuWidth = 192; // min-w-48 = 12rem = 192px
      const viewportWidth = window.innerWidth;

      // Check if there's enough space on the right
      const spaceOnRight = viewportWidth - parentRect.right;
      if (spaceOnRight < submenuWidth && parentRect.left > submenuWidth) {
        setSubmenuPosition('left');
      } else {
        setSubmenuPosition('right');
      }
    }
  }, [isSubmenuOpen]);

  useEffect(() => {
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
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
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
      {hasSubmenu && isSubmenuOpen && (
        <div
          ref={submenuRef}
          className={`
            absolute top-0 min-w-48 max-h-64 overflow-y-auto bg-shadow border border-gray-700 rounded-lg shadow-xl z-[10000]
            ${submenuPosition === 'right' ? 'left-full ml-1' : 'right-full mr-1'}
          `}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {item.submenu?.map(subItem => (
              <MenuItem
                key={subItem.id}
                item={subItem}
                onItemClick={onItemClick}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
      {item.separator && <div className="border-t border-gray-600 my-1" />}
    </div>
  );
}