import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ContextMenuState, ContextMenuConfig, ContextMenuItem } from './types';
import { 
  MdPlaylistAdd, 
  MdFavorite, 
  MdShare, 
  MdEdit, 
  MdDelete,
  MdPlayArrow,
  MdQueueMusic,
  MdFolder,
} from 'react-icons/md';


interface ContextMenuContextType {
  state: ContextMenuState;
  showMenu: (x: number, y: number, config: ContextMenuConfig, targetId?: string) => void;
  hideMenu: () => void;
  showSubmenu: (itemId: string, x: number, y: number) => void;
  hideSubmenu: (itemId: string) => void;
  hideAllSubmenus: () => void;
  getMenuItems: (triggerType: string, data: any) => ContextMenuItem[];
}

type ContextMenuAction = 
  | { type: 'SHOW_MENU'; payload: { x: number; y: number; config: ContextMenuConfig; targetId?: string } }
  | { type: 'HIDE_MENU' }
  | { type: 'SHOW_SUBMENU'; payload: { itemId: string; x: number; y: number } }
  | { type: 'HIDE_SUBMENU'; payload: { itemId: string } }
  | { type: 'HIDE_ALL_SUBMENUS' };

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);
const initialState: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  config: null,
  targetId: null,
  submenuStates: {},
};


function contextMenuReducer(state: ContextMenuState, action: ContextMenuAction): ContextMenuState {
  switch (action.type) {
    case 'SHOW_MENU':
      return {
        ...state,
        isOpen: true,
        position: { x: action.payload.x, y: action.payload.y },
        config: action.payload.config,
        targetId: action.payload.targetId || null,
        submenuStates: {},
      };
      
    case 'HIDE_MENU':
      return {
        ...state,
        isOpen: false,
        config: null,
        targetId: null,
        submenuStates: {},
      };
      
    case 'SHOW_SUBMENU':
      return {
        ...state,
        submenuStates: {
          ...state.submenuStates,
          [action.payload.itemId]: {
            isOpen: true,
            position: { x: action.payload.x, y: action.payload.y },
          },
        },
      };
      
    case 'HIDE_SUBMENU':
      const newSubmenuStates = { ...state.submenuStates };
      delete newSubmenuStates[action.payload.itemId];
      return {
        ...state,
        submenuStates: newSubmenuStates,
      };
      
    case 'HIDE_ALL_SUBMENUS':
      return {
        ...state,
        submenuStates: {},
      };
      
    default:
      return state;
  }
}

function getMenuItemsForContext(triggerType: string, data: any): ContextMenuItem[] {
  switch (triggerType) {
    case 'playlist-song':
      return [
        {
          id: 'play',
          label: 'Play Now',
          icon: MdPlayArrow,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          onClick: () => console.log('Play song:', data.song?.title),
        },
        {
          id: 'queue',
          label: 'Add to Queue',
          icon: MdQueueMusic,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          onClick: () => console.log('Add to queue:', data.song?.title),
        },
        {
          id: 'playlist',
          label: 'Add to Playlist',
          icon: MdPlaylistAdd,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          // Submenu with nested options
          submenu: [
            {
              id: 'new-playlist',
              label: 'Create New Playlist',
              icon: MdFolder,
              color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
              onClick: () => console.log('Create new playlist for:', data.song?.title),
            },
            { id: 'separator', label: '', separator: true },
            {
              id: 'playlist-1',
              label: 'Favorites',
              color: 'text-white',
              hoverColor: 'hover:bg-amethyst/20',
              onClick: () => console.log('Add to Favorites playlist'),
            },
            {
              id: 'playlist-2',
              label: 'Workout Mix',
              color: 'text-white',
              hoverColor: 'hover:bg-amethyst/20',
              onClick: () => console.log('Add to Workout Mix playlist'),
            },
            {
              id: 'playlist-3',
              label: 'Chill Vibes',
              color: 'text-white',
              hoverColor: 'hover:bg-amethyst/20',
              onClick: () => console.log('Add to Chill Vibes playlist'),
            }
          ],
          separator: true,
        },
        {
          id: 'favorite',
          label: 'Add to Favorites',
          icon: MdFavorite,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          onClick: () => console.log('Add to favorites:', data.song?.title),
        },
        {
          id: 'share',
          label: 'Share Song link',
          icon: MdShare,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          separator: true,
        },
        {
          id: 'edit',
          label: 'Edit Details',
          icon: MdEdit,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          onClick: () => console.log('Edit song:', data.song?.title),
        },
        {
          id: 'remove',
          label: 'Remove from Playlist',
          icon: MdDelete,
          color: 'text-red-400',
          hoverColor: 'hover:bg-red-500/10',
          onClick: () => console.log('Remove song:', data.song?.title),
        },
      ];

    case 'sidebar-playlist':
      return [
        {
          id: 'play',
          label: 'Play Playlist',
          icon: MdPlayArrow,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          onClick: () => console.log('Play playlist:', data.title),
        },
        {
          id: 'edit',
          label: 'Edit Playlist',
          icon: MdEdit,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          onClick: () => console.log('Edit playlist:', data.title),
        },
        {
          id: 'share',
          label: 'Share Playlist link',
          icon: MdShare,
          color: 'text-white',
          hoverColor: 'hover:bg-amethyst/20',
          separator: true,
        },
        {
          id: 'delete',
          label: 'Delete Playlist',
          icon: MdDelete,
          color: 'text-red-400',
          hoverColor: 'hover:bg-red-500/10',
          onClick: () => console.log('Delete playlist:', data.title),
        },
      ];

    default:
      return [];
  }
}

interface ContextMenuProviderProps {
  children: React.ReactNode;
}

export function ContextMenuProvider({ children }: ContextMenuProviderProps) {
  const [state, dispatch] = useReducer(contextMenuReducer, initialState);

  const showMenu = useCallback((
    x: number, 
    y: number, 
    config: ContextMenuConfig, 
    targetId?: string
  ) => {
    dispatch({ 
      type: 'SHOW_MENU', 
      payload: { x, y, config, targetId } 
    });
  }, []);

  const hideMenu = useCallback(() => {
    dispatch({ type: 'HIDE_MENU' });
  }, []);

  const showSubmenu = useCallback((itemId: string, x: number, y: number) => {
    dispatch({ 
      type: 'SHOW_SUBMENU', 
      payload: { itemId, x, y } 
    });
  }, []);

  const hideSubmenu = useCallback((itemId: string) => {
    dispatch({ 
      type: 'HIDE_SUBMENU', 
      payload: { itemId } 
    });
  }, []);

  const hideAllSubmenus = useCallback(() => {
    dispatch({ type: 'HIDE_ALL_SUBMENUS' });
  }, []);

  const getMenuItems = useCallback((triggerType: string, data: any) => {
    return getMenuItemsForContext(triggerType, data);
  }, []);

  const value = {
    state,
    showMenu,
    hideMenu,
    showSubmenu,
    hideSubmenu,
    hideAllSubmenus,
    getMenuItems,
  };

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}