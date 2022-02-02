var nginxConf = `
events {
    multi_accept       on;
}

http {
    server {
        listen      port;
        listen      [::]:port;
        server_name example.com;
        root        ../unmined-web/;
        index       unmined.index.html;
    }
}`

configure = JSON.parse(File.readFrom("./plugins/BDSLM/config.json"))

function GetServerProperties() {
    let serverProperties = {};
    propertiesFile = File.readFrom("./server.properties").replace("\r", "").split(/\n/); // 读入server.properties并且分割每一行
    propertiesFile.forEach((item, _index) => {
        if (item && item.replace(" ", "").indexOf("#") != 0) {
            out = item.trim().split("="); // 以等号分割一行properties项，并去除两侧可能出现的等号
            serverProperties[out[0].trim()] = out[1].trim(); // 将各项存入serverProperties
        }
    });
    return serverProperties;
}

function RendMap() {
    let serverProperties = GetServerProperties();
    let zoomin = configure["mapRender"]["maxZoomLevel"];
    let zoomout = configure["mapRender"]["minZoomLevel"];
    log("启动地图渲染进程……");
    system.cmd("start .\\plugins\\BDSLM\\unmined\\unmined-cli.exe web render --world=\"./worlds/" + serverProperties["level-name"] + "\" --output=\"./plugins/BDSLM/unmined-web/\" --imageformat=webp -c --zoomin=" + zoomin + " --zoomout=" + zoomout, function GetRendMapResult(_exitcode, _output) { });
    setTimeout(applyConf, 10000);
}

function applyConf() {
    log("应用配置文件……");
    changeWebTitle();
    addMarkers();
}
function changeWebTitle() {
    if (configure["webserver"]["mapTitle"] != "default") {
        File.writeTo("./plugins/BDSLM/unmined-web/unmined.index.html", File.readFrom("./plugins/BDSLM/unmined-web/unmined.index.html").replaceAll("UnminedMapProperties.worldName", '"' + configure["webserver"]["mapTitle"] + '"'));
    }
}
function addMarkers() {
    let markers = JSON.parse(File.readFrom("./plugins/BDSLM/markers.json"));
    let writeOut = {};
    writeOut["isEnabled"] = true;
    writeOut["markers"] = [];
    markers.forEach((item, _index) => {
        item["image"] = "custom.pin.png";
        item["imageAnchor"] = ["0.5", 1];
        item["imageScale"] = "0.3";
        item["textColor"] = "red";
        item["offsetX"] = 0;
        item["offsetY"] = 20;
        item["font"] = "bold 20px Calibri,sans serif";
        writeOut["markers"].push(item);
    });
    writeOut = "UnminedCustomMarkers = " + data.toJson(writeOut, 4);
    File.writeTo("./plugins/BDSLM/unmined-web/custom.markers.js", writeOut);
}

function startNginxWebserver() {
    let port = configure["webserver"]["port"];
    File.writeTo("./plugins/BDSLM/nginx/conf/nginx.conf", nginxConf.replaceAll("port", port));
    log("启动nginx……");
    system.cmd(".\\plugins\\BDSLM\\nginx\\nginx.exe -s stop -p ./plugins/BDSLM/nginx/", function GetRendMapResult(_exitcode, _output) {
        system.cmd(".\\plugins\\BDSLM\\nginx\\nginx -p ./plugins/BDSLM/nginx/", function GetRendMapResult(_exitcode, _output) { });
    });
}
/*
function autoRendInit() {
    if (!isMapHolding) {
        log("地图挂起中……安全起见，准备阶段不能将地图挂起。等待10秒重试……");
        setTimeout(autoRenderInit, 10000);
    }
    else {
        log("挂起地图，准备更新渲染");
        mc.runcmdEx("save hold");
        autoRend();
    }
}
function autoRend() {
    if (isMapHolding) {
        log("地图已挂起，开始渲染。");
        RendMap();
        setTimeout(() => {
            mc.runcmdEx("save resume");
            log("恢复地图");
        }, 10000);
    }
    else {
        log("等待地图挂起……");
        setTimeout(autoRenderInit, 10000);
    }
}
function isMapHolding() {
    mc.runcmdEx("save query").output.indexOf("Data saved.");
}
*/

function Init() {
    if (configure["autoRend"]["enable"]) {
        setInterval(RendMap, configure["autoRend"]["cycle"] * 60 * 1000);
    }
    RendMap();
    startNginxWebserver();
}

Init();