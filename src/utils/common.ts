import { ethers, formatEther } from "ethers";

export const truncateAddress = (
    address: string | null | undefined,
    startCharCount = 5,
    lastCharCount = 4,
    parseAddress = true,
) => {
    if (!address) return '';
    try {
        const parsedAddress = parseAddress ? ethers.getAddress(address) : address;
        const endStartAt = parsedAddress.length - lastCharCount;
        return `${parsedAddress.slice(0, startCharCount)}...${parsedAddress.slice(endStartAt)}`;
    } catch {
        const endStartAt = address.length - lastCharCount;
        return `${address.slice(0, startCharCount)}...${address.slice(endStartAt)}`;
    }
};

export const isAllowedNumber = (value: string): boolean => {
    if (+value >= Number.MAX_SAFE_INTEGER || +value < 0) {
        return false;
    }
    return true;
};

export const isValidNumberKeypress = (value: string) => {
    return RegExp('[0-9]').test(value) || value == '.';
};

export const formatNumberHuman = (num: number, notation: Intl.NumberFormatOptions['notation'] = 'compact') => {
    if (num <= parseFloat(formatEther('10000'))) return num.toFixed(2); // less than 100 wei
    const formatter = new Intl.NumberFormat('en-US', {
        notation,
        maximumFractionDigits: 3,
        minimumFractionDigits: num < 1 && num !== 0 ? 2 : 2,
    });
    return formatter.format(num);
};

export const formatNumberInput = (num: number | string) => {
    return num.toString().match(/^-?\d+(?:\.\d{0,8})?/)![0];
};

export const getRandomNumberInRange = (min: number, max: number): number => {
    if (min > max) {
        return -1;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const toSentenceCase = (string: string) => {
    const newString = string.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (c) {
        return c.toUpperCase();
    });
    return newString;
};