const oneMonth = 1000 * 60 * 60 * 24 * 30.44;

export const dateToAge = (birthDateString: string) =>
  `${Math.floor((Date.now() - Date.parse(birthDateString)) / oneMonth)} months old`;
