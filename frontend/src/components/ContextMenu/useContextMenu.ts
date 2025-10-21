import { useCallback } from 'react';
import { useContextMenu as useContextMenuProvider } from './ContextMenuProvider';
import { ContextMenuConfig } from './types';


interface UseContextMenuReturn {
  showContextMenu: (
    event: React.MouseEvent,
    triggerType: string,
    data: any,
    customConfig?: Partial<ContextMenuConfig>
  ) => void;
  showContextMenuAt: (
    x: number,
    y: number,
    triggerType: string,
    data: any,
    customConfig?: Partial<ContextMenuConfig>
  ) => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const { showMenu, getMenuItems } = useContextMenuProvider();

  const showContextMenu = useCallback((
    event: React.MouseEvent,
    triggerType: string,
    data: any,
    customConfig?: Partial<ContextMenuConfig>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const items = getMenuItems(triggerType, data);
    if (items.length === 0) return;

    const config: ContextMenuConfig = {
      trigger: 'rightclick',
      items,
      position: 'auto',
      ...customConfig,
    };

    showMenu(event.clientX, event.clientY, config, data.id);
  }, [showMenu, getMenuItems]);

  const showContextMenuAt = useCallback((
    x: number,
    y: number,
    triggerType: string,
    data: any,
    customConfig?: Partial<ContextMenuConfig>
  ) => {
    const items = getMenuItems(triggerType, data);
    if (items.length === 0) return;

    const config: ContextMenuConfig = {
      trigger: 'click',
      items,
      position: 'auto',
      ...customConfig,
    };

    showMenu(x, y, config, data.id);
  }, [showMenu, getMenuItems]);

  return {
    showContextMenu,
    showContextMenuAt,
  };
}