var app;
var startDate = moment().subtract(7, 'days');
var endDate = moment();
var names_all = [];
var names_all2 = [];
function isInArray(value, array) {
    return array.indexOf(value) > -1;
}
var dict = {};
require(["esri/Map", "esri/Basemap", "esri/widgets/Home", "esri/views/MapView", "esri/layers/FeatureLayer", "esri/layers/GraphicsLayer", "esri/Graphic", "esri/tasks/support/Query", "esri/widgets/Popup", "esri/PopupTemplate", "esri/geometry/Polyline", "esri/geometry/Point", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleMarkerSymbol", "esri/widgets/Legend", "esri/widgets/Locate", "esri/renderers/UniqueValueRenderer", "esri/core/watchUtils", "esri/geometry/support/webMercatorUtils", "dojo/query", "dojo/domReady!"], function(Map, Basemap, Home, MapView, FeatureLayer, GraphicsLayer, Graphic, Query, Popup, PopupTemplate, Polyline, Point, SimpleLineSymbol, SimpleMarkerSymbol, Legend, Locate, UniqueValueRenderer, watchUtils, webMercatorUtils, query) {
    // App
    app = {
        scale: 50000000,
        center: [-111.0937, 39.3210],
        zoom: 5,
        initialExtent: null,
        basemap: "dark-gray",
        viewPadding: {
            bottom: 65
        },
        uiPadding: {
            top: 30,
            bottom: 15
        },
        mapView: null,
        sceneView: null,
        activeView: null,
        searchWidgetNav: null
    };
    // Map
    var map = new Map({
        basemap: app.basemap
    });
    app.mapView = new MapView({
        container: "mapViewDiv",
        map: map,
        zoom: app.zoom,
        center: app.center,
        padding: app.viewPadding,
        ui: {
            components: ["zoom"],
            padding: app.uiPadding
        },
        popup: {
            dockEnabled: true,
            dockOptions: {
                buttonEnabled: true,
                breakpoint: true,
                position: 'bottom-center'
            },
            visible: false
        },
        constraints: {
            rotationEnabled: false
        }
    });
    var homeBtn = new Home({
        view: app.mapView
    });
    app.mapView.ui.add(homeBtn, "top-left");
    var rendererPts = new UniqueValueRenderer({
        field: "name"
            //defaultSymbol: new SimpleFillSymbol()
    });
    var rendererPtsMRP = new UniqueValueRenderer({
        field: "name"
            //defaultSymbol: new SimpleFillSymbol()
    });
    var rendererLns = new UniqueValueRenderer({
        field: "name"
            //defaultSymbol: new SimpleFillSymbol()
    });
    app.mapView.popupManager.enabled = false;
    var gLayer = new GraphicsLayer({
        id: "tracks"
    });
    var gLayerHighlight = new GraphicsLayer({
        id: "tracks"
    });
    var legendLayer = new FeatureLayer({
        url: 'https://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/Tracked_Pelicans/FeatureServer'
    });
    var gLayerMRP = new GraphicsLayer({
        id: "mrp"
    });
    var gLayerMRPHighlight = new GraphicsLayer({
        id: "mrp"
    });
    var mrp = new FeatureLayer({
        url: 'http://maps.dnr.utah.gov:6080/arcgis/rest/services/DWR/ARGOS_AWPE/MapServer/1',
        outFields: ["*"],
        id: "mrpMain",
        renderer: rendererPtsMRP
    });
    var fl = new FeatureLayer({
        url: 'http://maps.dnr.utah.gov:6080/arcgis/rest/services/DWR/ARGOS_AWPE/MapServer/0',
        outFields: ["*"],
        id: 'dataPts',
        renderer: rendererPts
    });
    var colonies = new FeatureLayer({
        url: "http://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/Western_Breeding_Colonies/FeatureServer/0",
        outFields: ["*"],
        id: "colonies"
    });
    var resight = new FeatureLayer({
        url: "http://services.arcgis.com/ZzrwjTRez6FJiOq4/arcgis/rest/services/Pelican_Resight/FeatureServer/0",
        outFields: ["*"],
        id: "resight"
    });
    var locateGL = new GraphicsLayer();
    fl.load();
    var locateWidget = new Locate({
        view: app.mapView, // Attaches the Locate button to the view
        graphicsLayer: locateGL // The layer the locate graphic is assigned to
    });
    app.mapView.ui.add(locateWidget, "top-left");

    function removeHighlight() {
            $(".esri-legend__layer-cell.esri-legend__layer-cell--info.highlight").removeClass("highlight");
            gLayerMRPHighlight.removeAll();
            map.remove(gLayerMRPHighlight);
            gLayerHighlight.removeAll();
            map.remove(gLayerHighlight);
        }
    map.addMany([legendLayer, gLayer, gLayerMRP, mrp, colonies, locateGL]);
    // Search
    app.mapView.whenLayerView(mrp).then(function(lyrView) {
        lyrView.watch("updating", function(val) {
            if (!val) { // wait for the layer view to finish updating
                // query all the features available for drawing.
                lyrView.queryFeatures().then(function(results) {
                    $.each(results, function(index, value) {
                        var attributes = value.attributes;
                        var name = attributes.name;
                        var color = attributes.color;
                        var tList = [];
                        tList.push(name);
                        names_all2.push(name);
                        tList.push(color);
                        names_all.push(tList);
                        names_all.sort();
                    });
                    /*$('#nameselect').append("<option value='" + name+ "'>" + name + "</option>");*/
                });
                for (var n = 0; n < names_all.length; n++) {
                    dict[names_all[n][0]] = names_all[n][1];
                    $('#nameselect').append($('<option/>', {
                        value: names_all[n][0],
                        text: names_all[n][0]
                    }));
                }
                for (i in dict) {
                    rendererPts.addUniqueValueInfo(i, new SimpleMarkerSymbol({
                        color: dict[i],
                        size: '6px'
                    }));
                    rendererPtsMRP.addUniqueValueInfo(i, new SimpleMarkerSymbol({
                        color: dict[i],
                        size: '14px'
                    }));
                    rendererLns.addUniqueValueInfo(i, new SimpleLineSymbol({
                        color: dict[i],
                        width: 1
                    }));
                }
                $('#nameselect').multiselect({
                    includeSelectAllOption: true
                });
                $("#nameselect").multiselect('selectAll', false);
                $("#nameselect").multiselect('updateButtonText');
                legendLayer.renderer = rendererPtsMRP;
                mrp.renderer = rendererPtsMRP;
                var start = startDate.format('MM-DD-YYYY');
                var end = endDate.add(23, 'hours').format('MM-DD-YYYY');
                var dQuery = "Date_time <= date'" + end + "' AND Date_time >= date'" + start + "'";
                fl.definitionExpression = dQuery;
                fl.queryExtent().then(function(results) {
                    // go to the extent of the results satisfying the query
                    app.mapView.goTo(results.extent.expand(2)); /* default load*/
                });
                fl.queryFeatures().then(function(results) {
                    var ptt_list = [];
                    var geom = results.features;
                    geom.forEach(function(i) {
                        var x = i.attributes.name;
                        if (!isInArray(x, ptt_list)) {
                            ptt_list.push(x);
                        }
                    });
                    var ptList = [];
                    for (var i = 0; i < ptt_list.length; i++) {
                        var latLngArray = [];
                        var ptList2 = [];
                        geom.forEach(function(arrayItem) {
                            if (arrayItem.attributes.name == ptt_list[i]) {
                                ptList2.push(arrayItem);
                                var coords = [];
                                coords.push(arrayItem.geometry.longitude);
                                coords.push(arrayItem.geometry.latitude);
                                latLngArray.push(coords);
                            }
                        });
                        ptList2.sort(function(a, b) {
                            return parseFloat(a.attributes.Date_time) - parseFloat(b.attributes.Date_time);
                        });
                        ptList.push(ptList2);
                    }
                    for (var x = 0; x < ptList.length; x++) {
                        var coordinates = [];
                        var name = ptList[x][0].attributes.name;
                        for (var y = 0; y < ptList[x].length; y++) {
                            var coordTemp = [];
                            coordTemp.push(ptList[x][y].geometry.longitude);
                            coordTemp.push(ptList[x][y].geometry.latitude);
                            coordinates.push(coordTemp);
                        }
                        var endIndex = ptList[x].length - 1;
                        var date1 = ptList[x][endIndex].attributes.Date_time;
                        var ptAtt = {
                            name: name,
                            Date_time: date1
                        };
                        var mrpPt = new Point({
                            latitude: ptList[x][endIndex].geometry.latitude,
                            longitude: ptList[x][endIndex].geometry.longitude,
                        });
                        var mrpGraphic = new Graphic({
                            geometry: mrpPt,
                            symbol: new SimpleMarkerSymbol({
                                color: dict[name],
                                size: '13px'
                            }),
                            attributes: ptAtt
                        });
                        gLayerMRP.add(mrpGraphic);
                        var pl = new Polyline({
                            paths: coordinates
                        });
                        var lineAtt = {
                            name: name
                        };
                        var lineSymbol = new SimpleLineSymbol({
                            color: dict[name],
                            width: "1.5px"
                        });
                        var plGraphic = new Graphic({
                            geometry: pl,
                            symbol: lineSymbol,
                            attributes: lineAtt
                        });
                        gLayer.add(plGraphic);
                    }
                });
                map.remove(mrp);
                gLayer.popupEnabled = false;
                var legend = new Legend({
                    view: app.mapView,
                    layerInfos: [{
                        layer: legendLayer,
                        title: "Tracked Pelicans"
                    }, {
                        layer: colonies,
                        title: "Breeding Colonies"
                    }, {
                        layer: resight,
                        title: "Pelican Band Resightings"
                    }]
                });
                legend.startup();
                app.mapView.ui.add(legend, "bottom-left");
            }
        });
    });
    // Panel Events
    query(".calcite-panels .panel").on("show.bs.collapse", function(e) {
        if (app.activeView.popup.currentDockPosition) {
            app.activeView.popup.dockEnabled = false;
        }
    });
    $('ul.basemapUL li').click(function() {
        app.mapView.map.basemap = this.id;
        $(this).addClass('highlightBasemap');
        $(this).siblings().removeClass('highlightBasemap');
    });
    $(".dropdown-menu a").click(function() {
        $(this).closest(".dropdown-menu").prev().dropdown("toggle");
    });
    // Collapsible popup (optional)
    query(".esri-popup .esri-title").on("click", function(e) {
        query(".esri-popup .esri-container").toggleClass("esri-popup-collapsed");
        app.activeView.popup.reposition();
    });
    // Home
    $('#hideTrack').click(function() {
        if ($(this).is(':checked')) {
            map.remove(gLayer);
        } else {
            map.add(gLayer);
        }
    });
    $('#togglePts').click(function() {
        if ($(this).is(':checked') && typeof startDate !== "undefined") {
            map.add(fl);
            map.add(gLayerMRP);
        } else if ($(this).is(':checked') && typeof startDate == "undefined") {
            $('#togglePts').attr('checked', false);
        } else {
            map.remove(fl);
        }
    });
    $('#toggleHeat').click(function() {
        if ($(this).is(':checked')) {
            map.add(resight);
            map.add(gLayer);
            map.add(gLayerMRP);
        } else if ($(this).is(':checked') && typeof startDate == "undefined") {
            $('#togglePts').attr('checked', false);
        } else {
            map.remove(resight);
        }
    });
    $('#toggleColony').click(function() {
        if ($(this).is(':checked')) {
            map.add(colonies);
            map.add(gLayer);
            map.add(gLayerMRP);
        } else {
            map.remove(colonies);
        }
    });
    $('#resetBtn').click(function(event) {
        event.preventDefault();
        $("#panelInfo").text("Most recent point for each pelican");
        $('#modalFilter').modal('hide');
        $('#daterange').val('Most Recent Points Shown');
        $('#nameselect').multiselect("selectAll", false);
        $('#nameselect').multiselect('refresh');
        $('#togglePts').attr('checked', false);
        removeHighlight();
        var rendererVis = new UniqueValueRenderer({
            field: "name"
                //defaultSymbol: new SimpleFillSymbol()
        });
        var selected = $('#nameselect option:selected').map(function(a, item) {
            return item.value;
        });
        for (var i = 0; i < selected.length; i++) {
            rendererVis.addUniqueValueInfo(selected[i], new SimpleMarkerSymbol({
                color: dict[selected[i]],
                size: '12px'
            }));
        }
        legendLayer.renderer = rendererVis;
        map.remove(fl);
        map.add(mrp);
        gLayer.removeAll();
        gLayerMRP.removeAll();
    });
    $('.panel-close').click(function(event) {
        event.preventDefault();
        $('#panelBasemaps').toggleClass('hidden show');
        $('#basemapNav2').toggleClass('active');
    });
    $('#filterNav2').click(function(event) {
        event.preventDefault();
        $('#filtercont').toggleClass('hidden show');
    });
    $('li#basemapNav2').click(function(event) {
        event.preventDefault();
        $('#panelBasemaps').toggleClass('hidden show');
        $('#basemapNav2').toggleClass('active');
    });
    $('#legendNav').click(function(event) {
        event.preventDefault();
        $('.esri-legend').toggleClass('hidden show');
        if ((screen.width < 768)) {
            // if screen size is 1025px wide or larger
            $('.esri-legend').toggleClass('forceLegend');
        }
        $('#legendNav').toggleClass('active');
    });
    $('#panelInfoBox').click(function(event) {
        $("#filterNav2").click();
    });
    $(document).ready(function() {
        $('#daterange').keypress(function(e) {
            if (e.which == 13) { // Checks for the enter key
                e.preventDefault();
                $("#applyBtn").click();
            }
        });
        function cb(start, end) {
            $('#daterange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        }
        cb(moment().subtract(3, 'days'), moment());
        $('#daterange').daterangepicker({
            autoApply: true,
            startDate: moment().subtract(7, 'days'),
            endDate: moment(),
            minDate: "08/10/2015",
            maxDate: moment(),
            parentEl: $("#filtercont"),
            ranges: {
                'Last 7 Days': [moment().subtract(7, 'days'), moment()],
                'Last 14 Days': [moment().subtract(14, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'Last 90 Days': [moment().subtract(3, 'months'), moment()],
                'Last Year': [moment().subtract(1, 'year'), moment()],
                'Show All Data': ["08/10/2015", moment()]
            },
            drops: 'down',
            opens: "center"
        }, function(start, end, label) {
            startDate = start;
            endDate = end;
        });
        $("#panelInfo").text(startDate.format('MM-DD-YYYY') + ' to ' + endDate.format('MM-DD-YYYY'));
        $(document).on('click', '#layers .dropdown-menu', function(e) {
            e.stopPropagation();
        });
        $(document).on('click', '.esri-legend .esri-legend__layer-cell--info', function(e) {
            var txt = $(e.target).text();
            var target = e.target;
            if (isInArray(txt, names_all2)) {
                removeHighlight();
                $(target).addClass('highlight');
                for (var i = 0; i < (gLayerMRP.graphics.items).length; i++) {
                    if (gLayerMRP.graphics.items[i].attributes.name == txt && gLayer.graphics.items[i].attributes.name == txt) {
                        var cloneGraphic = gLayerMRP.graphics.items[i].clone();
                        cloneGraphic.symbol.outline.color.g = 251;
                        cloneGraphic.symbol.outline.color.b = 255;
                        cloneGraphic.symbol.outline.width = 2;
                        gLayerMRPHighlight.add(cloneGraphic);
                        var cloneTrack = gLayer.graphics.items[i].clone();
                        cloneTrack.symbol.color.g = 251;
                        cloneTrack.symbol.color.b = 255;
                        cloneTrack.symbol.color.r = 0;
                        cloneTrack.symbol.width = 2;
                        gLayerHighlight.add(cloneTrack);
                    }
                }
                map.add(gLayerHighlight);
                map.add(gLayerMRPHighlight);
            }
        });
        $('#daterange').on('apply.daterangepicker', function(ev, picker) {
            $(this).val(picker.startDate.format('MM/DD/YYYY') + ' - ' + picker.endDate.format('MM/DD/YYYY'));
        });
        $('#daterange').on('cancel.daterangepicker', function(ev, picker) {
            $(this).val('');
        });
        $('#applyBtn').click(function(event) {
            $('#modalFilter').modal('hide');
            $('#load').toggleClass('hidden show');
            $('#filtercont').toggleClass('hidden show');
            event.preventDefault();
            $("#panelInfo").text(startDate.format('MM-DD-YYYY') + ' to ' + endDate.format('MM-DD-YYYY'));
            app.mapView.popup.close();
            //app.mapView.goTo(homeBtn.viewpoint);
            removeHighlight();
            gLayer.removeAll();
            gLayerMRP.removeAll();
            map.remove(mrp);
            var selected = $('#nameselect option:selected').map(function(a, item) {
                return item.value;
            });
            if (selected.length > 0) {
                var rendererVis = new UniqueValueRenderer({
                    field: "name"
                });
                legendLayer.renderer = rendererVis;
                var nameListStr = "name IN (";
                for (var i = 0; i < selected.length; i++) {
                    rendererVis.addUniqueValueInfo(selected[i], new SimpleMarkerSymbol({
                        color: dict[selected[i]],
                        size: '12px'
                    }));
                    if (i < selected.length - 1) {
                        nameListStr = nameListStr + "'" + selected[i] + "',";
                    } else {
                        nameListStr = nameListStr + "'" + selected[i] + "')";
                    }
                }
            } else {
                nameListStr = "";
            }
            var dQuery;
            if (startDate == null) {
                dQuery = "";
            } else {
                var sDate = startDate.format('MM-DD-YYYY');
                var eDate = endDate.add(23, 'hours').format('MM-DD-YYYY');
                dQuery = "Date_time <= date'" + eDate + "' AND Date_time >= date'" + sDate + "'";
            }
            var query;
            if (nameListStr == "" && dQuery.length > 2) {
                query = dQuery;
            } else if (nameListStr == "" && dQuery == "") {
                query = "name IN ()";
                $('#load').toggleClass('hidden show');
            } else if (nameListStr.length > 2 && dQuery.length == 0) {
                query = nameListStr;
            } else {
                query = dQuery + " AND " + nameListStr;
            }
            fl.definitionExpression = query;
            fl.queryExtent().then(function(results) {
                // go to the extent of the results satisfying the query
                app.mapView.goTo(results.extent.expand(1.75));
            });
            fl.queryFeatures().then(function(results) {
                var ptt_list = [];
                var geom = results.features;
                geom.forEach(function(i) {
                    var x = i.attributes.name;
                    if (!isInArray(x, ptt_list)) {
                        ptt_list.push(x);
                    }
                });
                var ptList = [];
                for (var i = 0; i < ptt_list.length; i++) {
                    var latLngArray = [];
                    var ptList2 = [];
                    geom.forEach(function(arrayItem) {
                        if (arrayItem.attributes.name == ptt_list[i]) {
                            ptList2.push(arrayItem);
                            var coords = [];
                            coords.push(arrayItem.geometry.longitude);
                            coords.push(arrayItem.geometry.latitude);
                            latLngArray.push(coords);
                        }
                    });
                    ptList2.sort(function(a, b) {
                        return parseFloat(a.attributes.Date_time) - parseFloat(b.attributes.Date_time);
                    });
                    ptList.push(ptList2);
                }
                for (var x = 0; x < ptList.length; x++) {
                    var coordinates = [];
                    var name = ptList[x][0].attributes.name;
                    for (var y = 0; y < ptList[x].length; y++) {
                        var coordTemp = [];
                        coordTemp.push(ptList[x][y].geometry.longitude);
                        coordTemp.push(ptList[x][y].geometry.latitude);
                        coordinates.push(coordTemp);
                    }
                    var endIndex = ptList[x].length - 1;
                    var date1 = ptList[x][endIndex].attributes.Date_time;
                    var ptAtt = {
                        name: name,
                        Date_time: date1
                    };
                    var mrpPt = new Point({
                        latitude: ptList[x][endIndex].geometry.latitude,
                        longitude: ptList[x][endIndex].geometry.longitude,
                    });
                    var mrpGraphic = new Graphic({
                        geometry: mrpPt,
                        symbol: new SimpleMarkerSymbol({
                            color: dict[name],
                            size: '13px'
                        }),
                        attributes: ptAtt
                    });
                    gLayerMRP.add(mrpGraphic);
                    var pl = new Polyline({
                        paths: coordinates
                    });
                    var lineAtt = {
                        name: name
                    };
                    var lineSymbol = new SimpleLineSymbol({
                        color: dict[name],
                        width: "1.5px"
                    });
                    var plGraphic = new Graphic({
                        geometry: pl,
                        symbol: lineSymbol,
                        attributes: lineAtt
                    });
                    gLayer.add(plGraphic);
                }
                $('#load').toggleClass('hidden show');
            });
            gLayer.popupEnabled = false;
            if (!$('#hideTrack').is(':checked')) {
                map.add(gLayer);
            }
            map.add(gLayerMRP);
        });
    });
    app.mapView.watch("updating", function(val) {
        if (val == 'loaded') {
            //hide gif
            $('#load').toggleClass('hidden show');
        } else {
            //show gif
            $('#load').toggleClass('hidden show');
        }
    }); // wait for the layer view to finish updating
    app.mapView.on("click", function(event) {
        app.mapView.hitTest(event.screenPoint).then(function(response) {
            if (response.results.length > 0 && response.results[0].graphic && response.results[0].graphic.layer.id == 'mrp') {
                var center = webMercatorUtils.geographicToWebMercator(new Point({
                    latitude: response.results[0].graphic.geometry.latitude,
                    longitude: response.results[0].graphic.geometry.longitude,
                }));
                var datePop = moment.unix((response.results[0].graphic.attributes.Date_time) / 1000);
                var name = response.results[0].graphic.attributes.name;
                datePop = datePop.format("dddd, MMMM Do YYYY, h:mm:ss a");
                app.mapView.popup.open({
                    title: name,
                    content: "Seen here on " + datePop,
                    location: center
                });
            } else if (response.results.length == 1 && response.results[0].graphic && response.results[0].graphic.layer.id == 'dataPts') {
                var center = webMercatorUtils.geographicToWebMercator(new Point({
                    latitude: response.results[0].graphic.geometry.latitude,
                    longitude: response.results[0].graphic.geometry.longitude,
                }));
                var datePop = moment.unix((response.results[0].graphic.attributes.Date_time) / 1000);
                var name = response.results[0].graphic.attributes.name;
                datePop = datePop.format("dddd, MMMM Do YYYY, h:mm:ss a");
                app.mapView.popup.open({
                    title: name,
                    content: "Seen here on " + datePop,
                    location: center
                });
            } else if (response.results.length == 1 && response.results[0].graphic && response.results[0].graphic.layer.id == 'mrpMain') {
                var center = webMercatorUtils.geographicToWebMercator(new Point({
                    latitude: response.results[0].graphic.geometry.latitude,
                    longitude: response.results[0].graphic.geometry.longitude,
                }));
                var datePop = moment.unix((response.results[0].graphic.attributes.Date_time) / 1000);
                var name = response.results[0].graphic.attributes.name;
                datePop = datePop.format("dddd, MMMM Do YYYY, h:mm:ss a");
                app.mapView.popup.open({
                    title: name,
                    content: "Seen here on " + datePop,
                    location: center
                });
            } else if (response.results.length == 1 && response.results[0].graphic && response.results[0].graphic.layer.id == 'colonies') {
                var center = webMercatorUtils.geographicToWebMercator(new Point({
                    latitude: response.results[0].graphic.geometry.latitude,
                    longitude: response.results[0].graphic.geometry.longitude,
                }));
                var name = response.results[0].graphic.attributes.COLONY + " Colony";
                var population = response.results[0].graphic.attributes.Pop;
                app.mapView.popup.open({
                    title: name,
                    content: "Estimated Population of " + population.toString(),
                    location: center
                });
            } else if (response.results.length == 1 && response.results[0].graphic && response.results[0].graphic.layer.id == 'resight') {
                var center = webMercatorUtils.geographicToWebMercator(new Point({
                    latitude: response.results[0].graphic.geometry.latitude,
                    longitude: response.results[0].graphic.geometry.longitude,
                }));
                var band = response.results[0].graphic.attributes.Band_No_;
                var bandDate = response.results[0].graphic.attributes.Year_Banded;
                var returnDate = moment.unix((response.results[0].graphic.attributes.Return_Date) / 1000).format('MMMM Do YYYY');
                var bandingLocation = response.results[0].graphic.attributes.Banding_Location;
                var bandStatus = response.results[0].graphic.attributes.Status;
                app.mapView.popup.open({
                    title: "Resighting Location",
                    content: "<b>Band Number:</b> " + band + "<br><b>Banding Date:</b> " + bandDate + "<br><b>Return Date:</b> " + returnDate + "<br><b>Natal Colony:</b> " + bandingLocation + "<br><b>Status:</b> " + bandStatus + "<br>",
                    location: center
                });
            } else if (response.results.length > 1) {
                for (var x = 0; x < response.results.length; x++) {
                    if (response.results[x].graphic.layer.id == 'mrp' || response.results[x].graphic.layer.id == 'dataPts') {
                        var center = webMercatorUtils.geographicToWebMercator(new Point({
                            latitude: response.results[x].graphic.geometry.latitude,
                            longitude: response.results[x].graphic.geometry.longitude,
                        }));
                        var datePop = moment.unix((response.results[x].graphic.attributes.Date_time) / 1000);
                        var name = response.results[x].graphic.attributes.name;
                        datePop = datePop.format("dddd, MMMM Do YYYY, h:mm:ss a");
                        app.mapView.popup.open({
                            title: name,
                            content: "Seen here on " + datePop,
                            location: center
                        });
                    }
                }
            } else {
                app.mapView.popup.close();
                removeHighlight();
            }
        });
    });
});