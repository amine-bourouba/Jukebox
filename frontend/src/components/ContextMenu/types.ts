export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  hoverColor?: string;
  separator?: boolean;
  
  submenu?: ContextMenuItem[];
}

export interface ContextMenuConfig {
  trigger: 'click' | 'rightclick' | 'both';
  items: ContextMenuItem[];
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}

export interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number };
  config: ContextMenuConfig | null;
  targetId: string | null;
  submenuStates: Record<string, {
    isOpen: boolean;
    position: { x: number; y: number };
  }>;
}

export interface SubmenuTriggerProps {
  item: ContextMenuItem;
  onSubmenuToggle: (itemId: string, position: { x: number; y: number }) => void;
  onSubmenuClose: (itemId: string) => void;
  isSubmenuOpen: boolean;
}

export type ContextMenuTrigger = 
  | 'playlist-song'
  | 'sidebar-playlist' 
  | 'sidebar-artist'
  | 'sidebar-genre'
  | 'custom';

export interface MenuConfigurations {
  [key: string]: (data: any) => ContextMenuItem[];
}