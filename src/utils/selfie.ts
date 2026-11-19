/**
 * Which KYC photo to show as a person's picture.
 *
 * clientSelfieBlobUrl ({clientId}/selfies/selfie.jpg) is the last frame of the
 * liveness challenge — often taken mid head-turn. The front-facing pose
 * ({clientId}/selfies/selfie_front.jpg) is uploaded in the same folder for every
 * KYC with pose photos, so it is derived from the client's own selfie URL.
 * Older KYCs have no pose photos: callers fall back to the original on error.
 */
// selfie.jpg, or a pose (selfie_left.jpg…) that older KYCs stored as the main
// selfie by mistake — every pose upload used to overwrite clientSelfieBlobUrl.
const MAIN_SELFIE = /\/selfies\/selfie(_(?:front|up|down|left|right))?\.jpg(\?.*)?$/;

export const frontSelfieUrl = (selfieUrl?: string | null): string | undefined => {
  if (!selfieUrl) return undefined;
  return MAIN_SELFIE.test(selfieUrl)
    ? selfieUrl.replace(MAIN_SELFIE, '/selfies/selfie_front.jpg$2')
    : selfieUrl;
};
