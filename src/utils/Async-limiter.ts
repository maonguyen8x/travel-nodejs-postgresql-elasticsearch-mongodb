import pLimit from 'p-limit';

export const asyncLimiter = async (arrFunction: Promise<any>[], maxExecute?: number): Promise<any> => {
  const limit = pLimit(maxExecute || 10);

  const input = arrFunction.map((item) => limit(() => item));

  return Promise.all(input);
};
