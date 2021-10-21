export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const convertPointRankingToPointScore = (pointRanking: number): number => {
  let pointScore = 0;
  if (pointRanking >= 90) {
    pointScore = 5;
  } else if (pointRanking >= 80) {
    pointScore = 4;
  } else if (pointRanking >= 70) {
    pointScore = 3;
  } else if (pointRanking >= 60) {
    pointScore = 2;
  } else if (pointRanking > 50) {
    pointScore = 1;
  } else if (pointRanking === 50 || pointRanking === 0) {
    pointScore = 0;
  } else if (pointRanking >= 40) {
    pointScore = -1;
  } else if (pointRanking >= 30) {
    pointScore = -2;
  } else if (pointRanking >= 20) {
    pointScore = -3;
  } else if (pointRanking >= 10) {
    pointScore = -4;
  } else {
    pointScore = -5;
  }
  return pointScore;
};
