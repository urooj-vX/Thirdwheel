export const HERO_MOTION_CONFIG = {
  assets: {
    boy: '/illustrations/boy.png',
    girl: '/illustrations/girl.png',
    wordmark: '/illustrations/wordmark.png',
    family: '/illustrations/family.svg',
    hands: '/illustrations/hands.svg',
    stickyNote: '/illustrations/undraw_sticky-note.svg',
    chatText: '/illustrations/undraw_chat-text.svg',
  },
  colors: {
    bgPaper: '#F8F6F1',
    bgHero: '#FEF8E0', // Soft butter yellow
    bgCircle: '#F2D891', // Deeper warm tint circle behind wordmark
    inkDark: '#1C1917',
    burntOrange: '#C85A32',
    mutedGray: '#78716C',
  },
  onLoad: {
    wordmarkWipeDuration: 1.1,
    wordmarkWipeEase: 'power2.inOut',
    characterDuration: 0.9,
    characterEase: 'power3.out',
    characterDelay: 0.3,
  },
  scroll: {
    pinDuration: '100vh',
    groupScaleEnd: 0.78,
    boySubtleTilt: -1.5,
  },
  container: {
    maxWidth: '1280px',
    aspectRatio: '2.5 / 1', // Fixed aspect ratio for the wordmark + characters set container
  },
  positions: {
    // Boy stands BESIDE the "T", shoulder touching T's left stem, feet on baseline (bottom: 0%)
    boy: {
      left: '7.5%',
      bottom: '0%',
      height: '82%',
    },
    // Wordmark in center (whole T visible, whole L visible)
    wordmark: {
      left: '17.5%',
      top: '44%',
      width: '65%',
    },
    // Girl stands on right, back touching right edge of "L", feet on baseline (bottom: 0%)
    girl: {
      left: '82.5%',
      bottom: '0%',
      height: '76%',
    },
    // Small accent doodles (~7% width, clear of wordmark)
    stickyNote: {
      left: '2%',
      top: '10%',
      width: '7%',
    },
    chatText: {
      left: '91%',
      top: '8%',
      width: '7%',
    },
    // Soft Circle behind wordmark (~58% width, off-center)
    circleBg: {
      left: '21%',
      top: '45%',
      width: '58%',
    },
  },
};


