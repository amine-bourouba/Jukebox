import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ContextMenuState, ContextMenuConfig, ContextMenuItem } from './types';
import { 
  MdPlaylistAdd, 
  MdFavorite, 
  MdShare, 
  MdEdit, 
  MdDelete,
  MdPlayArrow,
  MdQueueMusic 
} from 'react-icons/md';


interface ContextMenuContextType {
  state: ContextMenuState;
  showMenu: (x: number, y: number, config: ContextMenuConfig, targetId?: string) => void;
  hideMenu: () => void;
  getMenuItems: (triggerType: string, data: any) => ContextMenuItem[];
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

type ContextMenuAction = 
  | { type: 'SHOW_MENU'; payload: { x: number; y: number; config: ContextMenuConfig; targetId?: string } }
  | { type: 'HIDE_MENU' };

const initialState: ContextMenuState = {
  isOpen: false,
  position: { x: 0, y: 0 },
  config: null,
  targetId: null,
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
      };
    case 'HIDE_MENU':
      return {
        ...state,
        isOpen: false,
        config: null,
        targetId: null,
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
          onClick: () => console.log('Play song:', data.song?.title),
        },
        {
          id: 'queue',
          label: 'Add to Queue',
          icon: MdQueueMusic,
          color: 'text-white',
          onClick: () => console.log('Add to queue:', data.song?.title),
        },
        {
          id: 'playlist',
          label: 'Add to Playlist',
          icon: MdPlaylistAdd,
          color: 'text-white',
          onClick: () => console.log('Add to playlist:', data.song?.title),
          separator: true,
        },
        {
          id: 'favorite',
          label: 'Add to Favorites',
          icon: MdFavorite,
          color: 'text-white',
          onClick: () => console.log('Add to favorites:', data.song?.title),
        },
        {
          id: 'share',
          label: 'Share Song',
          icon: MdShare,
          color: 'text-white',
          onClick: () => console.log('Share song:', data.song?.title),
          separator: true,
        },
        {
          id: 'edit',
          label: 'Edit Details',
          icon: MdEdit,
          color: 'text-white',
          onClick: () => console.log('Edit song:', data.song?.title),
        },
        {
          id: 'remove',
          label: 'Remove from Playlist',
          icon: MdDelete,
          color: 'text-red-400',
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
          onClick: () => console.log('Play playlist:', data.title),
        },
        {
          id: 'edit',
          label: 'Edit Playlist',
          icon: MdEdit,
          color: 'text-white',
          onClick: () => console.log('Edit playlist:', data.title),
        },
        {
          id: 'share',
          label: 'Share Playlist',
          icon: MdShare,
          color: 'text-white',
          onClick: () => console.log('Share playlist:', data.title),
          separator: true,
        },
        {
          id: 'delete',
          label: 'Delete Playlist',
          icon: MdDelete,
          color: 'text-red-400',
          onClick: () => console.log('Delete playlist:', data.title),
        },
      ];

    case 'sidebar-artist':
      return [
        {
          id: 'play',
          label: 'Play All Songs',
          icon: MdPlayArrow,
          onClick: () => console.log('Play artist:', data),
        },
        {
          id: 'favorite',
          label: 'Follow Artist',
          icon: MdFavorite,
          onClick: () => console.log('Follow artist:', data),
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

  /**
   * Prevent unnecessary re-renders of components.
   */

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

  const getMenuItems = useCallback((triggerType: string, data: any) => {
    return getMenuItemsForContext(triggerType, data);
  }, []);

  const value = {
    state,
    showMenu,
    hideMenu,
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