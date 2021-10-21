import {AnyObject} from '@loopback/repository';
import {get} from 'lodash';
export function compare(itemA: AnyObject, itemB: AnyObject, propertyName: string) {
  if (itemA[propertyName] < itemB[propertyName]) {
    return -1;
  }
  if (itemA[propertyName] > itemB[propertyName]) {
    return 1;
  }
  return 0;
}

export function compareByIndex(itemA: AnyObject, itemB: AnyObject, propertyName: string, sourceList: number[]) {
  if (sourceList.indexOf(itemA[propertyName]) < sourceList.indexOf(itemB[propertyName])) {
    return -1;
  }
  if (sourceList.indexOf(itemA[propertyName]) > sourceList.indexOf(itemB[propertyName])) {
    return 1;
  }
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sortByList(arr: any[], propertyName: string, orderingArr: number[]) {
  return orderingArr.map((item) => arr.find((element) => get(element, propertyName) === item)).filter((item) => item);
}
