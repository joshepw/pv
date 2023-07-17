const Sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const CountDecimals = function (value) {
    if(Math.floor(value) === value) {
		return 0;
	}

    return value.toString().split(".")[1].length || 0; 
};

const ParseValue = function(value, factor = 1.0) {
	if (CountDecimals(factor) > 0) {
		return (value * factor).toFixed(CountDecimals(factor));
	}

	return value;
};

const ParseSignedValue = function(value, factor = 1.0) {
	parsed = value.toString(16);
	parsed = parseInt(parsed, 16);
	
	if ((parsed & 0x8000) > 0) {
		parsed = parsed - 0x10000;
	}

	return parsed;
};

exports.Sleep = Sleep;
exports.CountDecimals = CountDecimals;
exports.ParseValue = ParseValue;
exports.ParseSignedValue = ParseSignedValue;