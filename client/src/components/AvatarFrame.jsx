export default function AvatarFrame({ emoji = '🌱', level = 1 }) {
  return (
    <div className={`avatar-frame level-${Math.min(4, Math.max(1, level))}`}>
      {emoji}
    </div>
  );
}
