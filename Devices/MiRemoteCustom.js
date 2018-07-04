var Service,Characteristic;

MiRemoteCustom = function(platform, config) {
    this.platform = platform;
    this.config = config;

    this.platform.log.debug("[MiRemoteCustom]Initializing MiRemoteCustom: " + this.config["ip"]);
    
    return new MiRemoteCustomService(this);
}

MiRemoteCustomService = function(dThis) {
    this.name = dThis.config['Name'];
    this.token = dThis.config['token'];
    this.data = dThis.config['data'];
    this.interval = dThis.config['interval'];
    if(!this.interval){
        this.interval = 1;
    }

    this.readydevice = false;
    var configarray = {
        address: dThis.config['ip'],
        token: dThis.config['token']
    };
    this.device = dThis.platform.getMiioDevice(configarray,this);

    Service = dThis.platform.HomebridgeAPI.hap.Service;
    Characteristic = dThis.platform.HomebridgeAPI.hap.Characteristic;

    this.platform = dThis.platform;
    this.onoffstate = false;
}

MiRemoteCustomService.prototype.getServices = function() {
    var that = this;
    var services = [];
    var tokensan = this.token.substring(this.token.length-8);
    var infoService = new Service.AccessoryInformation();
    infoService
        .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
        .setCharacteristic(Characteristic.Model, "MiIRRemote-Custom")
        .setCharacteristic(Characteristic.SerialNumber, tokensan);
    services.push(infoService);   
    var MiRemoteCustomServices = new Service.Switch(this.name);
    var MiRemoteCustomServicesCharacteristic = MiRemoteCustomServices.getCharacteristic(Characteristic.On);
    MiRemoteCustomServicesCharacteristic
        .on('set',function(value, callback) {
            try{
                if(this.readydevice){
                    var onoff = value ? "on" : "off";
                    this.onoffstate = value;
                    var onoffdata = this.data[onoff];
                    for (var i in onoffdata) {
                        var dataa = onoffdata[i];
                        var arra = dataa.split('|');
                        var duetime = arra[0];
                        var code = arra[1];
                        setTimeout(function(code,onoff,i,duetime) {
                            that.device.call("miIO.ir_play", {"freq":38400,"code":code}).then(result => {
                                that.platform.log.debug("[" + that.name + "]Custom: Send " + onoff + " - " + i + " interval:" + duetime);
                            }).catch(function(err) {
                                if(err == "Error: Call to device timed out"){
                                    that.platform.log.debug("[" + this.name + "][ERROR]Custom - Remote Offline");
                                }else{
                                    that.platform.log.error("[" + this.name + "][ERROR]Custom Error: " + err);
                                }
                            });
                        },duetime * 1000,code,onoff,i,duetime)    
                    }
                }else{
                   that.platform.log.info("[" + this.name + "][ERROR]Custom - Unready");
                }
                callback(null);
            }catch(err) {
                that.platform.log.error("[General][ERROR]Custom Error: " + err);
                callback(err);
            }
        }.bind(this))
        .on('get', function(callback) {
            callback(null,this.onoffstate);
        }.bind(this))
        
    services.push(MiRemoteCustomServices);
    return services;
}