// Server-side "now", kept outside components so render functions stay pure.
export const nowMs = () => Date.now();
