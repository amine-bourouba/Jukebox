import { MdMusicNote } from "react-icons/md";
import { useImageColor } from '../../../hooks/useImageColor';

export default function SongPreview(props) {
  const { currentTrack } = props;
  const accentColor = useImageColor(currentTrack.coverUrl);

  const panelStyle = accentColor
    ? { background: `linear-gradient(to bottom, ${accentColor}bb 0%, #0f0f1a55 100%)` }
    : undefined;

  return (
    <div
      className="rounded-md bg-gradient-to-b from-shadow/70 to-shadow/30 pt-3 px-3 mx-2 mt-3.5 h-full transition-[background] duration-700"
      style={panelStyle}
    >
      <div className="flex justify-center items-center mb-4 rounded-md h-80 w-full text-white overflow-hidden">
        {currentTrack.coverUrl ? (
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <MdMusicNote size={200} />
        )}
      </div>
      <p className="text-2xl font-bold text-white">{currentTrack.title}</p>
      <p className="text-lg text-gray-400 font-medium">{currentTrack.artist}</p>
      <p className="text-sm text-gray-500">{currentTrack.album}</p>
    </div>
  );
}