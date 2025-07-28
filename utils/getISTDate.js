export const getIsTTime = () => {
  const now = new Date();
  const ISTOffset = 330 * 60 * 1000; // IST = UTC + 5:30
  const ist = new Date(now.getTime() + ISTOffset);

  const hours = ist.getHours().toString().padStart(2, '0');
  const minutes = ist.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};