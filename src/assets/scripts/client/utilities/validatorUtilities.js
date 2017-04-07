import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';

/**
 * This will return true if it is not an object or it is empty
 *
 * @funtion isNotObjectOrIsEmpty
 * @param input {object}
 * @return {boolean}
 */
export const isEmptyObject = (value) => {
    return _isObject(value) && _isEmpty(value);
};

/**
 * This will return true if it is not an object or it is empty or is an array
 *
 * @funtion isNotObjectOrIsEmptyOrIsArray
 * @param input {object}
 * @return {boolean}
 */
export const isEmptyObjectOrArray = (value) => {
    return !_isObject(value) || _isEmpty(value) || _isArray(value);
};

/**
 * This will return true if it is not an array or it is empty
 *
 * @funtion isNotObjectOrIsEmpty
 * @param input {object}
 * @return {boolean}
 */
export const isEmptyOrNotArray = (value) => {
    return !_isArray(value) || _isEmpty(value);
};
