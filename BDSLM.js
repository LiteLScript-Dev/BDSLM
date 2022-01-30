var nginxConf = "\
events {\n\
    multi_accept       on;\n\
}\n\
\n\
http {\n\
    server {\n\
        listen      port;\n\
        listen      [::]:port;\n\
        server_name example.com;\n\
        root        ../unmined-web/;\n\
        index       unmined.index.html;\n\
    }\n\
}"

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
    let zoomin = configure["maxZoomLevel"];
    let zoomout = configure["minZoomLevel"];
    system.cmd("start .\\plugins\\BDSLM\\unmined\\unmined-cli.exe web render --world=\"./worlds/" + serverProperties["level-name"] + "\" --output=\"./plugins/BDSLM/unmined-web/\" --imageformat=webp -c --zoomin=" + zoomin + " --zoomout=" + zoomout, function GetRendMapResult(_exitcode, _output) { });
    log("启动nginx。");
    startNginxWebserver();
}

function startNginxWebserver() {
    let port = configure["port"];
    File.writeTo("./plugins/BDSLM/nginx/conf/nginx.conf", nginxConf.replaceAll("port", port));
    system.cmd(".\\plugins\\BDSLM\\nginx\\nginx.exe -s stop -p ./plugins/BDSLM/nginx/", function GetRendMapResult(_exitcode, _output) {
        system.newProcess(".\\plugins\\BDSLM\\nginx\\nginx -p ./plugins/BDSLM/nginx/", function GetRendMapResult(_exitcode, _output) { });
    });
}

function Init() {
    log("启动地图渲染进程！请耐心等待弹出窗口退出后再打开卫星地图网页。");
    RendMap();
}

Init();