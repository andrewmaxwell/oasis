export const dateToAge = (birthDateString: string) => {
  const today = new Date();
  const birthDate = new Date(birthDateString);

  let ageInYears = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    ageInYears--;
  }

  if (ageInYears < 2) {
    const oneMonth = 1000 * 60 * 60 * 24 * 30.44; // Approximate milliseconds in a month
    const ageInMilliseconds = today.getTime() - birthDate.getTime();
    const ageInMonths = Math.floor(ageInMilliseconds / oneMonth);
    return `${ageInMonths} months old`;
  } else {
    return `${ageInYears} years old`;
  }
};
