const process = require('process');
const mqtt = require('mqtt');
const fs = require('fs');
const Config = require('./config');
const Helpers = require('./helpers');
const ModbusRTU = require('modbus-serial');
const Models = require('./models');

const accumulated = new Models.AccumulatedValues();

String.prototype.hashCode = function () {
	var hash = 0,
		i, chr;
	if (this.length === 0) return hash;
	for (i = 0; i < this.length; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return Buffer.from(`${hash}`).toString('base64');
}

const client = mqtt.connect(`mqtt://${Config.MQTT.host}`, {
	username: Config.MQTT.user,
	password: Config.MQTT.pass,
});

const client_status = {
	mqtt_connected: false,
	mbus_connected: false,
	pv_data: {
		voltage: 0,
		current: 0,
		power: 0,
	},
};

/**
 * 
 * @param {Models.Values} values 
 */
const calculateAccumulativeData = (values) => {
	accumulated.BatteryPower += (values.BatteryPower / (3600 / Config.Serial.interval));
	accumulated.GridPower += (values.GridPower / (3600 / Config.Serial.interval));
	accumulated.OutputPower += (values.OutputPower / (3600 / Config.Serial.interval));
	accumulated.PvPower += (values.PvPower / (3600 / Config.Serial.interval));

	values.AccumulatedBatteryPower = accumulated.BatteryPower;
	values.AccumulatedGridPower = accumulated.GridPower;
	values.AccumulatedOutputPower = accumulated.OutputPower;
	values.AccumulatedPvPower = accumulated.PvPower;
};

/**
 * Send data to services
 * 
 * @param {Models.Values} values 
 */
const onSendData = (values) => {
	calculateAccumulativeData(values);

	Object.keys(Models.ValuesConfig).forEach(key => {
		sendProbeSensorConfig(key);
		client.publish(`homeassistant/sensor/must-inverter/${key}`, `${values[key]}`);
	});
};

/**
 * Get ADC converter values 
 */
const readADCValues = async () => {
	return {
		voltage: 0,
		current: 0,
		power: 0,
	};
};

/**
 * Connect to serial port
 */
const connectToSerial = () => {
	(async () => {
		while (!client_status.mbus_connected) {
			try {
				const modbus = new ModbusRTU();
				const interval = Config.Serial.interval * 1000;

				if (!fs.existsSync(Config.Serial.port)) {
					throw new Error(`The port is not available, will be try again in ${Config.Serial.timeout}s ...`);
				}

				console.log(`[MBUS] ${new Date()} - Connected to ${Config.Serial.port}`);
				client_status.mbus_connected = true;

				modbus.connectRTUBuffered(Config.Serial.port, Config.Serial.config);
				modbus.setTimeout(Config.Serial.timeout * 1000);
				modbus.setID(10);

				setInterval(async () => {
					try {
						const config = (await modbus.readHoldingRegisters(30000, 27)).data;
						const values = (await modbus.readHoldingRegisters(30030, 30)).data;

						onSendData(new Models.Values(config, values, client_status.pv_data));
					} catch (error) {
						console.warn(`[MBUS] ${new Date()} - ${error}`);
					}
				}, interval);
			} catch (error) {
				client_status.mbus_connected = false;
				console.warn(`[MBUS] ${new Date()} - ${error}`);

				await Helpers.Sleep(Config.Serial.timeout * 1000);
			}
		}
	})();
};

/**
 * Send MQTT Probe sensor config
 * 
 * @param {string} key 
 */
const sendProbeSensorConfig = (key) => {
	const payload = {
		device: {
			identifiers: ['must-inverter_PV3300TLV'],
			manufacturer: 'Must',
			model: 'PV3300TLV',
			name: 'Hybrid Solar Inverter',
		},
		name: key.split(/(?=[A-Z])/).join(' '),
		state_topic: `homeassistant/sensor/must-inverter/${key}`,
		unique_id: `must-inverter_${key}_${key.hashCode()}`,
		...Models.ValuesConfig[key],
	};

	client.publish(`homeassistant/sensor/must-inverter/${key}/config`, JSON.stringify(payload));
};

client.on('connect', () => {
	client_status.mqtt_connected = true;
	console.log(`[MQTT] ${new Date()} - Connected to ${Config.MQTT.host}`);

	Object.keys(Models.ValuesConfig).forEach(key => {
		sendProbeSensorConfig(key);
	});

	client.subscribe(Config.MQTT.topics.inverter, (err) => {
		if (err) console.warn(`[MQTT] ${new Date()} - Error to subscribe ${Config.MQTT.topics.inverter}: ${err}`);
	});

	connectToSerial();
});

client.on('close', () => {
	client_status.mqtt_connected = false;
	console.warn(`[MQTT] ${new Date()} - Close connection`);
	process.exit(1);
});

client.on("message", (topic, message) => {
	if (Config.MQTT.topics.inverter == topic) {
		const data = message.toString();
		const json = JSON.parse(data);

		client_status.pv_data.current = parseFloat(json.current || 0);
		client_status.pv_data.power = parseFloat(json.power || 0);
		client_status.pv_data.voltage = parseFloat(json.voltage || 0);
	}
});