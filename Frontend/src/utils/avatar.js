const seeds = ['Zed', 'Mochi', 'Nova', 'Pixel', 'Lumi'];

export const AVATARS = seeds.map((seed, index) => ({
  id: index + 1,
  label: seed,
  // DiceBear Clay: soft, playful 3D-like avatars served as SVG.
  url: `https://api.dicebear.com/10.x/clay/svg?seed=${encodeURIComponent(seed)}`
}));

export function avatarUrl(id = 1) {
  return AVATARS.find((x) => x.id === Number(id))?.url || AVATARS[0].url;
}
