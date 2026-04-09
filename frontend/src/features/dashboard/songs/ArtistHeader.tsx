import { useDispatch, useSelector } from 'react-redux';
import { MdPlayArrow, MdShuffle } from 'react-icons/md';
import { IoPersonCircleOutline } from 'react-icons/io5';

import { AppDispatch, RootState } from '../../../store/store';
import { followArtist, unfollowArtist } from '../../../store/artistSlice';
import type { Artist } from '../../../store/artistSlice';

interface ArtistHeaderProps {
  artist: Artist | null;
  songCount: number;
  onPlay: () => void;
  onShuffle: () => void;
}

export default function ArtistHeader({ artist, songCount, onPlay, onShuffle }: ArtistHeaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const followedIds = useSelector((state: RootState) => state.artists.followedArtistIds);
  const isFollowing = artist ? followedIds.includes(artist.id) : false;

  const handleFollow = () => {
    if (!artist) return;
    if (isFollowing) dispatch(unfollowArtist(artist.id));
    else dispatch(followArtist(artist.id));
  };

  const followerCount = artist?._count?.followers ?? 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 flex-shrink-0 pb-6">
      <div className="flex items-end gap-6">
        {/* Avatar */}
        <div className="shrink-0 w-44 h-44 rounded-full bg-shadow/80 flex items-center justify-center text-amethyst shadow-2xl overflow-hidden">
          {artist?.imageUrl ? (
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover" />
          ) : (
            <IoPersonCircleOutline size={120} />
          )}
        </div>

        {/* Info + actions */}
        <div className="flex flex-col gap-2 pb-2">
          <p className="text-xs font-bold text-white uppercase tracking-widest">Artist</p>
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-6xl font-extrabold text-white leading-tight">{artist?.name ?? ''}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={onPlay}
                disabled={songCount === 0}
                aria-label="Play all songs"
                className="bg-amethyst hover:bg-amethyst/80 active:scale-95 text-moon rounded-full p-3 shadow-lg transition-transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <MdPlayArrow size={32} />
              </button>
              <button
                onClick={onShuffle}
                disabled={songCount === 0}
                aria-label="Shuffle songs"
                className="text-silver hover:text-moon transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MdShuffle size={28} />
              </button>
            </div>
          </div>
          <p className="text-silver text-sm">
            {songCount} {songCount === 1 ? 'song' : 'songs'}
            {followerCount > 0 && (
              <span className="ml-3">{followerCount.toLocaleString()} {followerCount === 1 ? 'follower' : 'followers'}</span>
            )}
          </p>
          {artist && (
            <div className="mt-1">
              <button
                onClick={handleFollow}
                aria-label={isFollowing ? 'Unfollow artist' : 'Follow artist'}
                className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
                  isFollowing
                    ? 'border-silver text-silver hover:border-moon hover:text-moon'
                    : 'border-amethyst text-amethyst hover:bg-amethyst hover:text-moon'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
