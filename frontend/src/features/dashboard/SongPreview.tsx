import { MdMusicNote } from "react-icons/md";

export default function SongPreview(props) {
  return (
    <div className="rounded-md bg-gradient-to-b from-shadow/70  to-shadow/30 pt-3 px-3 mx-2 mt-3.5 h-full">
      <div className="flex justify-center items-center mb-4 bg-gradient-to-b from-shadow/70  to-shadow/30 rounded-md h-80 w-full text-white">
        <MdMusicNote size={200} />
      </div>
      <p className="text-2xl font-bold text-white">{props.currentTrack.title}</p>
      <p className="text-lg text-gray-400 font-medium">{props.currentTrack.artist}</p>
      <p className="text-sm text-gray-500">{props.currentTrack.album}</p>
    </div>
  );
}