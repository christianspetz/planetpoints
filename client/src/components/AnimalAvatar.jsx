const STAGE_SIZES = {
  1: { size: 48, ring: 2, glow: 'none', label: 'Baby' },
  2: { size: 56, ring: 3, glow: '0 0 8px rgba(82,183,136,0.2)', label: 'Young' },
  3: { size: 64, ring: 3, glow: '0 0 16px rgba(82,183,136,0.3)', label: 'Adult' },
  4: { size: 72, ring: 4, glow: '0 0 20px rgba(255,183,3,0.3)', label: 'Elder' },
  5: { size: 80, ring: 4, glow: '0 0 24px rgba(155,93,229,0.35)', label: 'Ancient' },
};

export default function AnimalAvatar({ emoji, color, stage = 1, size: sizeProp, showLabel = false, animate = false, className = '' }) {
  const stageConfig = STAGE_SIZES[Math.min(5, Math.max(1, stage))] || STAGE_SIZES[1];
  const size = sizeProp || stageConfig.size;
  const fontSize = size * 0.5;

  return (
    <div className={`animal-avatar ${animate ? 'animal-breathing' : ''} ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        className={`animal-avatar-circle stage-${stage}`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `${color}18`,
          border: `${stageConfig.ring}px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${fontSize}px`,
          boxShadow: stageConfig.glow,
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          position: 'relative',
        }}
      >
        {emoji}
        {stage >= 4 && (
          <div className="avatar-sparkle" style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `1px solid ${stage >= 5 ? '#9B5DE5' : '#FFB703'}`,
            opacity: 0.5,
            animation: 'avatarPulse 2s ease-in-out infinite',
          }} />
        )}
      </div>
      {showLabel && (
        <span style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: color,
          fontFamily: 'var(--font-heading)',
        }}>
          {stageConfig.label}
        </span>
      )}
    </div>
  );
}
