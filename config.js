exports.Serial = {
	port: '/dev/ttyUSB0',
	config: { 
		baudRate: 9600,
		databits: 8,
		parity: 'none',
		autoOpen: false
	},
	timeout: 10,
	interval: 5,
};

exports.MQTT = {
	host: '10.147.1.79',
	user: 'joshepw',
	pass: 'codelyoko',
	topics: {
		inverter: "esp/inverter",
	}
};