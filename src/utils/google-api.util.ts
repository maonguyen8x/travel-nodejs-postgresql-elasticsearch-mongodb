import {AnyObject} from '@loopback/repository';
import axios from 'axios';
import {get} from 'lodash';
import {GOOGLE_API_KEY} from '../constants/variable.constant';

export const getLocationWithKeywordSearch = async (keywordSearch: string): Promise<any> => {
  const {data} = await axios.get(
    encodeURI(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?key=${GOOGLE_API_KEY}&input=${keywordSearch}`,
    ),
  );
  if (data?.status === 'OK') {
    return data?.results;
  } else {
    return [];
  }
};

export const getDetailLocationWithPlaceId = async (placeId: string): Promise<any> => {
  const {data} = await axios.get(
    encodeURI(`https://maps.googleapis.com/maps/api/place/details/json?key=${GOOGLE_API_KEY}&placeid=${placeId}`),
  );
  if (data?.status === 'OK') {
    return data?.result;
  } else {
    return {};
  }
};

export const getDetailLocationWithPlaceIdFormatted = async (
  placeId: string,
): Promise<{
  name: string;
  placeId: string;
  coordinates: string;
  formattedAddress: string;
  country: string;
  administrativeAreaLevel1: string;
  administrativeAreaLevel2: string;
  administrativeAreaLevel3: string;
  route: string;
  streetNumber: string;
}> => {
  const {data} = await axios.get(
    encodeURI(`https://maps.googleapis.com/maps/api/place/details/json?key=${GOOGLE_API_KEY}&placeid=${placeId}`),
  );
  return formatPositionData(data);
};

const getValue = (data: {types: string | string[]; long_name: string; short_name: string}, key: string): string => {
  if (data?.types?.includes(key)) {
    return data.long_name;
  }
  return '';
};

const getDataExhausting = (results: any[], key: string): string => {
  return results.reduce((accumulator, currentValue) => {
    if (accumulator) {
      return accumulator;
    }
    const value = getValue(currentValue, key);
    if (value) {
      return value;
    }
    return accumulator;
  }, '');
};

const formatPositionData = (
  data: AnyObject,
): {
  name: string;
  placeId: string;
  coordinates: string;
  formattedAddress: string;
  country: string;
  administrativeAreaLevel1: string;
  administrativeAreaLevel2: string;
  administrativeAreaLevel3: string;
  route: string;
  streetNumber: string;
} => {
  const name = data?.result?.name || '';
  const placeId = data?.result?.place_id || '';
  const coordinates = `${data?.result?.geometry?.location?.lat}, ${data?.result?.geometry?.location?.lng}` || '';
  const addressComponents = data?.result?.address_components || [];
  const country = getDataExhausting(addressComponents, 'country');
  const administrativeAreaLevel1 = getDataExhausting(addressComponents, 'administrative_area_level_1');
  const administrativeAreaLevel2 = getDataExhausting(addressComponents, 'administrative_area_level_2');
  const administrativeAreaLevel3 = getDataExhausting(addressComponents, 'administrative_area_level_3');
  const route = getDataExhausting(addressComponents, 'route');
  const streetNumber = getDataExhausting(addressComponents, 'street_number');
  const formattedAddress = [
    streetNumber,
    route,
    administrativeAreaLevel3,
    administrativeAreaLevel2,
    administrativeAreaLevel1,
    country,
  ]
    .filter((item) => item)
    .join(', ');
  return {
    name,
    placeId,
    coordinates,
    formattedAddress,
    country,
    administrativeAreaLevel1,
    administrativeAreaLevel2,
    administrativeAreaLevel3,
    route,
    streetNumber,
  };
};
