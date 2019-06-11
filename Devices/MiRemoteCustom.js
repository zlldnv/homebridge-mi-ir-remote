let Service, Characteristic;


MiRemoteCustom = function(platform, config) {
  const {ip} = config;
  this.platform = platform;
  this.config = config;
  this.platform.log.debug(`[MiRemoteCustom]Initializing MiRemoteCustom: ${ip}`);
  return new MiRemoteCustomService(this);
};

class MiRemoteCustomService {
  constructor({config, platform}) {
    const {Name, token, data, interval = 1, ip} = config;
    this.name = Name;
    this.token = token;
    this.data = data;
    this.interval = interval;

    this.readydevice = false;
    this.device = dThis.platform.getMiioDevice(
      {
        address: ip,
        token
      },
      this
    );

    Service = platform.HomebridgeAPI.hap.Service;
    Characteristic = platform.HomebridgeAPI.hap.Characteristic;

    this.platform = platform;
    this.onoffstate = false;
  }

  getServices() {
    const self = this;
    const services = [];
    const serialNumber = this.token.substring(this.token.length - 8);
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
      .setCharacteristic(Characteristic.Model, "MiIRRemote-Custom")
      .setCharacteristic(Characteristic.SerialNumber, serialNumber);
    services.push(infoService);
    const MiRemoteCustomServices = new Service.Switch(this.name);
    const MiRemoteCustomServicesCharacteristic = MiRemoteCustomServices.getCharacteristic(Characteristic.On);
    MiRemoteCustomServicesCharacteristic.on(
      "set",
      function(value, callback) {
        try {
          if (this.readydevice) {
            const onoff = value ? "on" : "off";
            this.onoffstate = value;
            const onoffdata = this.data[onoff];
            for (let i in onoffdata) {
              const [duetime, code] = onoffdata[i].split("|");
              setTimeout(
                function(code, onoff, i, duetime) {
                  self.device
                    .call("miIO.ir_play", {freq: 38400, code})
                    .then(() => {
                      self.platform.log.debug(`[${self.name}] Custom: Send ${onoff} - ${i} interval: ${duetime}`);
                    })
                    .catch(function(err) {
                      if (err == "Error: Call to device timed out") {
                        self.platform.log.debug(`[${this.name}][ERROR]Custom - Remote Offline`);
                      } else {
                        self.platform.log.error(`[${this.name}][ERROR]Custom Error: ${err}`);
                      }
                    });
                },
                duetime * 1000,
                code,
                onoff,
                i,
                duetime
              );
            }
          } else {
            self.platform.log.info(`[${this.name}][ERROR]Custom - Unready`);
          }
          callback(null);
        } catch (err) {
          self.platform.log.error(`[General][ERROR]Custom Error: ${err}`);
          callback(err);
        }
      }.bind(this)
    ).on(
      "get",
      function(callback) {
        callback(null, this.onoffstate);
      }.bind(this)
    );

    services.push(MiRemoteCustomServices);
    return services;
  };
}
