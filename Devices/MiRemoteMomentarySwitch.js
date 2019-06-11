let Service, Characteristic;

MiRemoteMomentarySwitch = function(platform, config) {
  this.platform = platform;
  this.config = config;

  this.platform.log.debug("[MomentarySwitch]Initializing MomentarySwitch: " + this.config["ip"]);
  return new MiRemoteMomentarySwitchService(this);
};

class MiRemoteMomentarySwitchService {
  constructor({config, platform, ip}) {
    const {Name, token, data} = config;
    this.name = Name;
    this.token = token;
    this.data = data;
    this.platform = platform;

    this.readydevice = false;

    this.device = platform.getMiioDevice({address: ip, token}, this);

    Service = platform.HomebridgeAPI.hap.Service;
    Characteristic = platform.HomebridgeAPI.hap.Characteristic;

    this.onoffstate = false;
    this.SwitchStatus;
  }

  getServices() {
    const self = this;
    const serialNumber = this.token.substring(this.token.length - 8);
    const infoService = new Service.AccessoryInformation();
    infoService
      .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
      .setCharacteristic(Characteristic.Model, "MiIRRemote-MomentarySwitch")
      .setCharacteristic(Characteristic.SerialNumber, serialNumber);
    const MiRemoteMomentarySwitchServices = (this.SwitchStatus = new Service.Switch(this.name));
    const MiRemoteMomentarySwitchServicesCharacteristic = MiRemoteMomentarySwitchServices.getCharacteristic(
      Characteristic.On
    );
    MiRemoteMomentarySwitchServicesCharacteristic.on(
      "set",
      function(value, callback) {
        try {
          if (value && this.readydevice) {
            self.device
              .call("miIO.ir_play", {freq: 38400, code: this.data})
              .then(() => {
                self.platform.log.debug(`[${self.name}]MomentarySwitch: Turned On`);
                setTimeout(function() {
                  self.SwitchStatus.getCharacteristic(Characteristic.On).updateValue(false);
                  self.onoffstate = false;
                  self.platform.log.debug(`[${self.name}]MomentarySwitch: Auto Turned Off"`);
                }, 0.3 * 1000);
                callback(null);
              })
              .catch(function(err) {
                self.platform.log.error(`[${self.name}][Custom][ERROR] Error: ${err}`);
                callback(err);
              });
          } else {
            setTimeout(function() {
              self.SwitchStatus.getCharacteristic(Characteristic.On).updateValue(false);
              self.onoffstate = false;
              self.platform.log.info(`[${self.name}]MomentarySwitch: Unready Turned Off`);
            }, 0.3 * 1000);
            callback(null);
          }
        } catch (err) {
          self.platform.log.error(`[${this.name}][ERROR]MomentarySwitch Error: ${err}`);
          callback(err);
        }
      }.bind(this)
    ).on(
      "get",
      function(callback) {
        callback(null, this.onoffstate);
      }.bind(this)
    );

    return [infoService, MiRemoteMomentarySwitchServices];
  }
}
