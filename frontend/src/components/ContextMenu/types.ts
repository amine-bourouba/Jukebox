export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
  separator?: boolean;
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