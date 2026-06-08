const camelCase = (str) => {
    const strings = str.split('-');
    return strings.reduce((acc, val) => {
        return `${acc}${val[0].toUpperCase()}${val.slice(1)}`;
    });
};
export default camelCase;
