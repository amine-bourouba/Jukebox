import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useContextMenu } from './ContextMenuProvider';
import MenuItem from './MenuItem';


export default function ContextMenu() {
  const { state, hideMenu, hideAllSubmenus } = useContextMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (menuRef.current && !menuRef.current.contains(target)) {
        const submenuElements = document.querySelectorAll('[data-submenu]');
        const isOutsideAllMenus = Array.from(submenuElements).every(
          submenu => !submenu.contains(target)
        );
        
        if (isOutsideAllMenus) {
          hideMenu();
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          hideMenu();
          break;
        case 'ArrowLeft':
          hideAllSubmenus();
          break;
      }
    };

    const handleScroll = () => hideMenu();
    const handleResize = () => hideMenu();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [state.isOpen, hideMenu, hideAllSubmenus]);

  const getMenuPosition = (isSubmenu = false, submenuId?: string) => {
    if (!state.isOpen || !state.config) return {};

    let position, menuHeight;

    if (isSubmenu && submenuId && state.submenuStates[submenuId]) {
      position = state.submenuStates[submenuId].position;
      const submenuItems = findSubmenuItems(state.config.items, submenuId);
      menuHeight = (submenuItems?.length || 0) * 40 + 16;
    } else {
      position = state.position;
      menuHeight = (state.config.items.length * 40) + 16;
    }

    const { x, y } = position;
    const menuWidth = 200;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > viewportWidth) {
      adjustedX = isSubmenu 
        ? x - menuWidth - 8 
        : viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 10;
    }

    adjustedX = Math.max(10, adjustedX);
    adjustedY = Math.max(10, adjustedY);

    return {
      position: 'fixed' as const,
      left: adjustedX,
      top: adjustedY,
      zIndex: isSubmenu ? 10000 : 9999,
    };
  };

  const findSubmenuItems = (items: any[], submenuId: string): any[] | null => {
    for (const item of items) {
      if (item.id === submenuId && item.submenu) {
        return item.submenu;
      }
      if (item.submenu) {
        const found = findSubmenuItems(item.submenu, submenuId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleItemClick = (item: any) => {
    if (item.onClick && !item.disabled) {
      item.onClick();
      hideMenu();
    }
  };

  if (!state.isOpen || !state.config) {
    return null;
  }

  const renderSubmenus = () => {
    return Object.entries(state.submenuStates).map(([submenuId, submenuState]) => {
      if (!submenuState.isOpen) return null;

      const submenuItems = findSubmenuItems(state.config!.items, submenuId);
      if (!submenuItems) return null;

      return createPortal(
        <div
          key={submenuId}
          data-submenu={submenuId}
          className="bg-shadow border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-48 max-h-48 overflow-y-auto"
          style={getMenuPosition(true, submenuId)}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {submenuItems.map(item => (
              <MenuItem
                key={item.id}
                item={item}
                onItemClick={handleItemClick}
                level={1}
              />
            ))}
          </div>
        </div> as React.ReactNode,
        document.body
      );
    });
  };

  const mainMenu = createPortal(
    <div
      ref={menuRef}
      className="bg-shadow border border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-48"
      style={getMenuPosition()}
      role="menu"
      aria-orientation="vertical"
    >
      <div className="py-1">
        {state.config.items.map(item => (
          <MenuItem
            key={item.id}
            item={item}
            onItemClick={handleItemClick}
            level={0}
          />
        ))}
      </div>
    </div> as React.ReactNode,
    document.body
  );

  return (
    <>
      {mainMenu}
      {renderSubmenus()}
    </>
  );
}