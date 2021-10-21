import {Locations} from '../models';

export const generateAddress = (location: Locations | any) => {
  return [
    location.areaLevel5 || '',
    location.areaLevel4 || '',
    location.areaLevel3 || '',
    location.areaLevel2 || '',
    location.areaLevel1 || '',
    location.country || '',
  ]
    .filter((item) => item)
    .join(', ');
};
