let Service, Characteristic;

MiRemoteProjector = function(platform, config) {
  const {ip} = config;
  this.platform = platform;
  this.config = config;
  this.platform.log.debug(`[MiRemoteProjector]Initializing MiRemoteProjector: ${ip}`);
  return new MiRemoteProjectorService(this);
};

class MiRemoteProjectorService {
  constructor({config, platform}) {
    const {Name, token, data, interval = 1, ip} = config;
    this.name = Name;
    this.token = token;
    this.data = data;
    this.interval = interval;

    this.readydevice = false;
    this.device = platform.getMiioDevice(
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
    const serialNumber = this.token.substring(this.token.length - 8);
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
      .setCharacteristic(Characteristic.Model, "MiIRRemote-Projector")
      .setCharacteristic(Characteristic.SerialNumber, serialNumber);
    const MiRemoteProjectorServices = new Service.Switch(this.name);
    const MiRemoteProjectorServicesCharacteristic = MiRemoteProjectorServices.getCharacteristic(Characteristic.On);
    MiRemoteProjectorServicesCharacteristic.on(
      "set",
      function(value, callback) {
        if (this.readydevice) {
          const onoff = value ? "on" : "off";
          this.onoffstate = value;
          if (!value) {
            setTimeout(
              function() {
                this.device
                  .call("miIO.ir_play", {freq: 38400, code: this.data[onoff]})
                  .then(() => {
                    self.platform.log.debug(`[${this.name} Projector: Second ${onoff}`);
                  })
                  .catch(function(err) {
                    self.platform.log.error(`[${this.name}][ERROR]Projector Error: ${err}`);
                  });
              }.bind(this),
              this.interval * 1000
            );
          }
          this.device
            .call("miIO.ir_play", {freq: 38400, code: this.data[onoff]})
            .then(() => {
              self.platform.log.debug(`[${this.name}]Projector: ${onoff}`);
              callback(null);
            })
            .catch(function(err) {
              self.platform.log.error(`[${this.name}][ERROR]Projector Error: ${err}`);
              callback(err);
            });
        } else {
          self.platform.log.info(`[${this.name}]Projector: Unready`);
          callback(null);
        }
      }.bind(this)
    ).on(
      "get",
      function(callback) {
        callback(null, this.onoffstate);
      }.bind(this)
    );

    return [infoService, MiRemoteProjectorServices];
  }
}
