$(document).ready(function() {
    let clientWebsocket;

    $.ajaxSetup({
        cache: false
    });

    $.getJSON("config.json", function(data) {
        let serverId = 0;
        let regions = data.regions;
        $.each(regions, function(key, region) {
            let regionDiv = $("<div class=\"m-2\"></div>");
            let regionTitle = $("<h4>" + region.name + "</h4>");
            regionTitle.appendTo(regionDiv);
            let serversDiv = $("<div class=\"row\"></div>");
            $.each(region.servers, function(key, server) {
                let serverOption = `<div class="col-md-4">
                    <div class="form-check form-check-inline">
                        <input class="form-check-input m-3" type="radio" name="server" id="server${serverId}" value="${server.websocket}">
                        <label class="form-check-label" for="server${serverId}">${server.location}<br><small><a href="https://bgp.tools/as/${server.asn}" target="_blank">(${server.provider} - ${server.asn})</a></small></label>
                    </div>
                </div>`;
                $(serversDiv).append(serverOption);
                serverId++;
            });
            $(regionDiv).append(serversDiv);
            $("#app").append(regionDiv);
        });
        let submitButton = `<hr><button type="submit" id="run" class="btn btn-primary">Run</button>`;
        $("#app").append(submitButton)

        $('#address').keypress(function(event) {
            let keycode = (event.keyCode ? event.keyCode : event.which);
            if (keycode === 13) {
                checkAndRun();
            }
        });

        $("#run").click(function() {
            checkAndRun();
        });
    });

    function checkAndRun() {
        let selectedActionType = $("input[name='actionType']:checked").val();
        if (!selectedActionType) {
            alert("Please select a type.");
            return;
        }
        let selectedServer = $("input[name='server']:checked").val();
        if (!selectedServer) {
            alert("Please select a server.");
            return;
        }
        let address = $("#address").val();
        if (address == "") {
            alert("Please specify an address.");
            return;
        }
        runTest(selectedServer, selectedActionType, address);
    }

    function runTest(server, type, address) {
        if (clientWebsocket && clientWebsocket.readyState == clientWebsocket.OPEN) {
            clientWebsocket.close();
        }
        clientWebsocket = new WebSocket(server);
        clientWebsocket.onopen = function(e) {
            clientWebsocket.send(JSON.stringify({
                type: type,
                data: address
            }));
        };
        clientWebsocket.onmessage = function(event) {
            let received = JSON.parse(event.data);
            if (received.type === "status") {
                if (received.data === "start") {
                    $("#output").text("");
                }
            }
            if (received.type === "response") {
                $("#output").text($("#output").text() + received.data);
            }
            if (received.type === "error") {
                $("#output").text(received.data);
            }
        };
        clientWebsocket.onclose = function(event) {
            if (event.wasClean) {
                console.log("Websocket: Connection closed cleanly, code=" + event.code + " reason=" + event.reason);
            } else {
                console.log("Websocket: Connection died");
            }
        };
        clientWebsocket.onerror = function(error) {
            console.log("Websocket Error: " + error.message);
        };
    }
});