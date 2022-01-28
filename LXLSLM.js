function GetServerProperties() {
    var serverProperties = {};
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
    var serverProperties = GetServerProperties();
    system.cmd("start .\\plugins\\LXLSLM\\unmined\\unmined-cli.exe web render --world=\"./worlds/" + serverProperties["level-name"] + "\" --output=\"./plugins/LXLSLM/unmined-web/\" --imageformat=webp -c", function GetRendMapResult(_exitcode, _output) { });
    startPythonWebserver();
}

function startPythonWebserver() {
    port = JSON.parse(File.readFrom("./plugins/LXLSLM/config.json"))["port"];
    system.newProcess(".\\plugins\\LXLSLM\\webserver.exe " + port, function GetRendMapResult(_exitcode, _output) { });
}

function Init() {
    RendMap();
}

Init();