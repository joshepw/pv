exports.Serial = {
	port: '/dev/ttyUSB0',
	config: { 
		baudRate: 9600,
		databits: 8,
		parity: 'none',
		autoOpen: false
	},
};

exports.MQTT = {
	host: 'home.local',
	user: 'joshepw',
	pass: 'codelyoko',
};