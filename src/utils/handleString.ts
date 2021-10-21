import {HttpErrors} from '@loopback/rest';
import {ErrorCode} from '../constants/error.constant';
import _ from 'lodash';

export function changeAlias(str = ''): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export function convertNameToUserNameUnique(str = ''): string {
  return (
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/Đ/g, 'D')
      .replace(/\s/g, '_')
      .toLowerCase() + generateUniqueId()
  );
}

export function generateUniqueId(): string {
  return `_${Date.now().toString(36)}${Math.floor(Number.MAX_SAFE_INTEGER * Math.random()).toString(36)}`;
}

export function convertToNFD(str = ''): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function titleCase(str: string): string {
  const sentence = str.toLowerCase().split(' ');
  for (let i = 0; i < sentence.length; i++) {
    sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
  }
  return sentence.join(' ');
}

export const parseStringToGeo = (geo: string) => {
  const geoList = geo.split(',');
  if (geoList.length === 2) {
    return {
      lat: Number(geoList[0]),
      lon: Number(geoList[1]),
    };
  } else {
    throw new HttpErrors.BadRequest(ErrorCode.INVALID_COORDINATES);
  }
};

export function parseOrderToElasticSort(order: string[]) {
  return order.map((item) => {
    const list = item.split(' ');
    if (list.length && list[0] && list[1]) {
      return {
        [list[0]]: {
          order: String(list[1]).toLowerCase(),
        },
      };
    } else return {};
  });
}

export function concatStringForElastic(...str: any[]) {
  const newStr = str.filter((item) => {
    return item ? true : false;
  });
  return newStr.length > 1 && newStr[0] && newStr[1] ? newStr.join(' | ') : String(newStr[0]) ?? '';
}
