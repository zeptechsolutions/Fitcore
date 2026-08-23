export const AVATARS = [1,2,3,4,5].map((id) => ({
  id,
  url: `https://api.dicebear.com/10.x/lorelei/svg?seed=Zhealth-${id}`
}));

export function avatarUrl(id = 1) {
  return AVATARS.find((x) => x.id === Number(id))?.url || AVATARS[0].url;
}
