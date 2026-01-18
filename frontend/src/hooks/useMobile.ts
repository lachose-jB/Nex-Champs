export function useIsMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}
