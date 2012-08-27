TissueStack.Init = function (afterLoadingRoutine) {
	TissueStack.LoadDataBaseConfiguration();
	
	// hide second jquery coordinate search button  
	if (TissueStack.desktop) {
		$('#dataset_2_center_point_in_canvas').closest('.ui-btn').hide();
	}

	// prepare color maps
	TissueStack.Utils.indexColorMaps();

	// add phone menu for page navigation
	if (TissueStack.phone) {
		new TissueStack.PhoneMenu();
	}

	// create data store and load it with backend data
	TissueStack.dataSetStore = new TissueStack.DataSetStore(afterLoadingRoutine);
	
	// handle window resizing
	$(window).resize(function() {
		// this needs to be checked in cases where the resize fires before the creation of the dataSetNavigation
		if (typeof(TissueStack.dataSetNavigation) == "undefined" || typeof(TissueStack.dataSetNavigation.selectedDataSets) == 'undefined') {
			return;
		} 
		
		var dataSetCount = TissueStack.dataSetNavigation.selectedDataSets.count;
		
		TissueStack.Utils.adjustScreenContentToActualScreenSize(dataSetCount);
		// set new canvas dimensions
		for (var i=0;i<dataSetCount;i++) {
			var dataSet = TissueStack.dataSetStore.getDataSetById(TissueStack.dataSetNavigation.selectedDataSets["dataset_" + (i+1)]);
			for (var plane in dataSet.planes) {
				dataSet.planes[plane].resizeCanvas();
			}
		}
	});
};

TissueStack.InitUserInterface = function (initOpts) {
	if (TissueStack.dataSetNavigation.selectedDataSets.count == 0) {
		return;
	}

	// get all data sets that have been selected from the store and stuff them into the array for binding its events
	var datasets = [];
	for (var x=0;x<TissueStack.dataSetNavigation.selectedDataSets.count;x++) {
		var selectedKey = TissueStack.dataSetNavigation.selectedDataSets["dataset_" + (x+1)]; 
		datasets.push(TissueStack.dataSetStore.getDataSetById(selectedKey)); 
	}

	// determine the maximum number of data sets that are displayed. depends on the type of display
	var maxDataSets = (TissueStack.phone || TissueStack.tablet) ? 1 : 2;
	if (maxDataSets > datasets.length) {
		maxDataSets = datasets.length;
	}

	TissueStack.Utils.adjustScreenContentToActualScreenSize(maxDataSets);
	
	if(TissueStack.desktop){
		TissueStack.Utils.adjustBorderColorWhenMouseOver();	
	}
	
	for (var x=0;x<maxDataSets;x++) {
		var dataSet = datasets[x];
		
		if (!dataSet.data || dataSet.data.length == 0) {
			alert("Data set '" + dataSet.id + "' does not have any planes associated with it!");
			continue; 
		}
		
		// we use that for the image service to be able to abort pending requests
		var sessionId = TissueStack.Utils.generateSessionId();
		
		var now = new Date().getTime();
		
		// crate a contrast slider per data set
		if(TissueStack.desktop || TissueStack.tablet)
			var contrast = new TissueStack.ContrastCanvas("dataset_" + (x+1) + "_toolbox_canvas");
		// crate a contrast slider per data set for phone version
		if (TissueStack.phone){
			var contrast = new TissueStack.ContrastCanvas("dataset_1_toolbox_canvas_phone");
		}
		
		// loop over all planes in the data, create canvas and extent objects, then display them
		for (var i=0; i < dataSet.data.length; i++) {
			var dataForPlane = dataSet.data[i];
			var planeId = dataForPlane.name;
			
			var zoomLevels = eval(dataForPlane.zoomLevels);
			transformationMatrix = eval(dataForPlane.transformationMatrix);
			
			// create extent
			var extent = 
				new TissueStack.Extent(
					dataSet.id,
					dataForPlane.isTiled,
					dataForPlane.oneToOneZoomLevel,
					planeId,
					dataForPlane.maxSclices,
					dataForPlane.maxX,
					dataForPlane.maxY,
					zoomLevels,
					transformationMatrix, 
					dataForPlane.resolutionMm);

			// this is a bit of a hack to not have to change the fixed html layout if we have only 1 plane (classic 2D data):
			// in order to use the main view which is hard-coded to plane with id 'y', we'll make the only plane that we have 'y' 
			if (dataSet.data.length == 1) {
				planeId = 'y';
				extent.plane = planeId;
			}
			
			// create canvas
			var canvasElementSelector = "dataset_" + (x+1); 
			var plane = new TissueStack.Canvas(extent, "canvas_" + planeId + "_plane", canvasElementSelector);
			// set contrast
			plane.contrast = contrast;
			// set session id
			plane.sessionId = sessionId;

			// for scalebar to know its parent
			if (planeId == 'y') plane.is_main_view = true;
			plane.updateScaleBar();
			
			// store plane  
			dataSet.planes[planeId] = plane;

			// get the real world coordinates 
			dataSet.realWorldCoords[planeId] = plane.getDataExtent().getExtentCoordinates();
			
			// display data extent info on page
			plane.updateExtentInfo(dataSet.realWorldCoords[planeId]);

			// for desktop version show 2 small canvases
			if (TissueStack.phone || ((TissueStack.desktop || TissueStack.tablet) && planeId != 'y')) {
				plane.changeToZoomLevel(0);
			}
			
			plane.eraseCanvasContent();
			
			plane.queue.drawLowResolutionPreview(now);
			plane.queue.drawRequestAfterLowResolutionPreview(null, now);
		}
	}
};

TissueStack.BindGlobalEvents = function () {
	// DATA SET SEARCH AND ADDITION
	// avoid potential double binding by un-binding
	$('#server_search_button').unbind("click");
	//rebind
	$('#server_search_button').bind("click", function() {
		var val = $('#server_search_input').val();
		var url = TissueStack.Utils.verifyUrlSyntax(val);
		if (!url) {
			alert("You entered an invalid url!");
			return;
		}
		
		if (typeof(window.location.hostname) == "string" && val.indexOf(window.location.hostname) >=0) {
			alert("Your local instance's configuration is already in the list!");
			return;
		}
		
		$('#server_search_input').val(url);
		
		// get the actual host/domain name
		var domain = TissueStack.Utils.extractHostNameFromUrl(val);
		if (!domain) {
			alert("Could not read domain from url");
			return;
		}
		// replace . with _
		domain = domain.replace(/[.]/g,"_");
		
		if (url.substring(url.length-1) != '/') {
			url += "/";
		}
		
		url += "backend/data/list?include_plane_data=true";
		
		// contact server
		TissueStack.Utils.sendAjaxRequest(
			url, 'GET', true,
			function(data, textStatus, jqXHR) {
				if (!data.response && !data.error) {
					alert("Did not receive anyting, neither success nor error ....");
					return;
				}
				
				if (data.error) {
					var message = "Application Error: " + (data.error.message ? data.error.message : " no more info available. check logs.");
					alert(message);
					return;
				}
				
				if (data.response.noResults) {
					alert("No data sets found in configuration database");
					return;
				}
				
				var dataSets = data.response;
				
				for (var x=0;x<dataSets.length;x++) {
					var addedDataSet = TissueStack.dataSetStore.addDataSetToStore(dataSets[x], domain);
					if (addedDataSet) {
						if(TissueStack.desktop){
							TissueStack.dataSetNavigation.addDataSetToDynaTree(addedDataSet);
						}
						if (TissueStack.tablet || TissueStack.phone){
							TissueStack.dataSetNavigation.addDataSetToTabletTree(addedDataSet);
						}
					}
				}
			},
			function(jqXHR, textStatus, errorThrown) {
				alert("Error connecting to backend: " + textStatus + " " + errorThrown);
			}
		);
	});
};

TissueStack.LoadDataBaseConfiguration = function() {
	// we do this one synchronously
	TissueStack.Utils.sendAjaxRequest(
		"/backend/configuration/all/json", 'GET', false,
		function(data, textStatus, jqXHR) {
			if (!data.response && !data.error) {
				alert("Did not receive anyting, neither success nor error ....");
				return;
			}
			
			if (data.error) {
				var message = "Application Error: " + (data.error.message ? data.error.message : " no more info available. check logs.");
				alert(message);
				return;
			}
			
			if (data.response.noResults) {
				alert("No configuration info found in database");
				return;
			}
			var configuration = data.response;
			
			for (var x=0;x<configuration.length;x++) {
				if (!configuration[x] || !configuration[x].name || $.trim(!configuration[x].name.length) == 0) {
					continue;
				}
				TissueStack.configuration[configuration[x].name] = {};
				TissueStack.configuration[configuration[x].name].value = configuration[x].value;
				TissueStack.configuration[configuration[x].name].description = configuration[x].description ? configuration[x].description : "";
			};
		},
		function(jqXHR, textStatus, errorThrown) {
			alert("Error connecting to backend: " + textStatus + " " + errorThrown);
		}
	);
};

TissueStack.BindDataSetDependentEvents = function () {
	if (TissueStack.dataSetNavigation.selectedDataSets.count == 0) {
		return;
	}

	// get all data sets that have been selected from the store and stuff them into the array for binding its events
	var datasets = [];
	for (var x=0;x<TissueStack.dataSetNavigation.selectedDataSets.count;x++) {
		var selectedKey = TissueStack.dataSetNavigation.selectedDataSets["dataset_" + (x+1)]; 
		datasets.push(TissueStack.dataSetStore.getDataSetById(selectedKey)); 
	}

	// determine the maximum number of data sets that are displayed. depends on the type of display
	var maxDataSets = (TissueStack.phone || TissueStack.tablet) ? 1 : 2;
	if (maxDataSets > datasets.length) {
		maxDataSets = datasets.length;
	}

	// DRAWING INTERVAL CHANGE HANDLER
	// avoid potential double binding by un-binding at this stage
	$('#drawing_interval_button').unbind("click");
	//rebind
	$('#drawing_interval_button').bind("click", function() {
		TissueStack.configuration['default_drawing_interval'].value = parseInt($('#drawing_interval').val());
		
		for (var x=0;x<maxDataSets;x++) {
			var dataSet = datasets[x];
			
			for (var id in dataSet.planes) {	
				dataSet.planes[id].queue.setDrawingInterval(TissueStack.configuration['default_drawing_interval'].value);
			}
		}
	});
	
	// COLOR MAP CHANGE HANDLER
	// avoid potential double binding by un-binding at this stage
	$('input[name="color_map"]').unbind("click");
	// rebind
	$('input[name="color_map"]').bind("click", function(e) {
		for (var x=0;x<maxDataSets;x++) {
			var dataSet = datasets[x];
			
			for (var id in dataSet.planes) {	
				dataSet.planes[id].color_map = e.target.value;
				dataSet.planes[id].drawMe();
				if (dataSet.planes[id].getDataExtent().getIsTiled()) dataSet.planes[id].applyContrastAndColorMapToCanvasContent();
			}
		}
	});
	
	// now let's bind events that are intimately linked to their own data set
	for (var y=0;y<maxDataSets;y++) {
		var dataSet = datasets[y];

		if (TissueStack.desktop || TissueStack.tablet) {
			// COORDINATE CENTER FUNCTIONALITY FOR DESKTOP
			// avoid potential double binding by un-binding at this stage
			$('#dataset_' + (y+1) + '_center_point_in_canvas').unbind("click");
			// rebind
			$('#dataset_' + (y+1) + '_center_point_in_canvas').bind("click", [{actualDataSet: dataSet,x: y}], function(event) {
				var plane =
					TissueStack.Utils.returnFirstOccurranceOfPatternInStringArray(
							$("#" + (TissueStack.desktop || TissueStack.tablet || TissueStack.phone? "dataset_" + (event.data[0].x + 1) + "_": "") + "main_view_canvas").attr("class").split(" "), "^canvas_");
				if (!plane) {
					return;
				}
				var startPos = "canvas_".length;
				var planeId = plane.substring(startPos, startPos + 1);
				
				var xCoord = parseFloat($('#canvas_point_x').val());
				var yCoord = parseFloat($('#canvas_point_y').val());
				var zCoord = parseFloat($('#canvas_point_z').val());
				
				// this is a hack for 1 plane (simple 2D) data
				// we set z min/max to +/- infinity to pass the test
				if (event.data[0].actualDataSet.data.length == 1) {
					zCoord = 0;
					event.data[0].actualDataSet.realWorldCoords[planeId].min_z = Number.NEGATIVE_INFINITY;
					event.data[0].actualDataSet.realWorldCoords[planeId].max_z = Number.POSITIVE_INFINITY;
				}
				
				if (isNaN(xCoord) || isNaN(yCoord) || isNaN(zCoord)) {
					alert("Illegal coords");
					return;
				}
				
				// if we had a transformation matrix, we know we have been handed in real word coords and therefore need to convert back to pixel
				var givenCoords = {x: xCoord, y: yCoord, z: zCoord};
				plane = event.data[0].actualDataSet.planes[planeId];
				if (plane.getDataExtent().worldCoordinatesTransformationMatrix) {
					givenCoords = plane.getDataExtent().getPixelForWorldCoordinates(givenCoords);
				}

				if ((event.data[0].actualDataSet.planes[planeId] && (givenCoords.x < 0
						|| givenCoords.x > event.data[0].actualDataSet.planes[planeId].data_extent.x)) 
						|| (event.data[0].actualDataSet.planes[planeId] && (givenCoords.y < 0
								|| givenCoords.y > event.data[0].actualDataSet.planes[planeId].y))
								|| (event.data[0].actualDataSet.planes['z'] && (givenCoords.z < 0
										|| givenCoords.z > event.data[0].actualDataSet.planes[planeId].data_extent.max_slices))	) {
					alert("Illegal coords");
					return;
				}
				
				
				plane.redrawWithCenterAndCrossAtGivenPixelCoordinates(givenCoords, new Date().getTime());

				if (event.data[0].actualDataSet.data.length > 1) {
					var slider = $("#" + (plane.dataset_id == "" ? "" : plane.dataset_id + "_") + "canvas_main_slider");
					if (slider) {
						slider.val(givenCoords.z);
						slider.blur();
						setTimeout(function() {
							plane.events.changeSliceForPlane(givenCoords.z);
							}, 150);
					}
				}
			});

			// if we have only one plane, we don't need to register maximize or slider 
			if (dataSet.data.length == 1) {
				continue;
			}

			// MAXIMIZING SIDE VIEWS
			// avoid potential double binding by un-binding at this stage
			$('#dataset_' + (y+1) + '_left_side_view_maximize, #dataset_' + (y+1) + '_right_side_view_maximize').unbind("click");
			// rebind
			$('#dataset_' + (y+1) + '_left_side_view_maximize, #dataset_' + (y+1) + '_right_side_view_maximize').bind("click", [{actualDataSet: dataSet,x: y}], function(event) {
				// what side view and canvas called for maximization
				if (!event.target.id || !$("#" + event.target.id).attr("class")) {
					return;
				}

				var plane = TissueStack.Utils.returnFirstOccurranceOfPatternInStringArray($("#" + event.target.id).attr("class").split(" "), "^canvas_");
				if (!plane) {
					return;
				}
				var startPos = "canvas_".length;
				var sideViewPlaneId = plane.substring(startPos, startPos + 1);
				
				x = event.data[0].x;
				
				plane = TissueStack.Utils.returnFirstOccurranceOfPatternInStringArray($("#dataset_" + (x+1) +"_main_view_canvas").attr("class").split(" "), "^canvas_");
				if (!plane) {
					return;
				}
				var mainViewPlaneId = plane.substring(startPos, startPos + 1);
				
				// with the id we get the can get the main canvas and the side canvas and swap them, including their dimensions and zoom levels
				var mainCanvas = $("#dataset_" + (x+1) + "_main_view_canvas");
				var mainCanvasChildren = mainCanvas.children("canvas");
				if (!mainCanvasChildren || mainCanvasChildren.length == 0) {
					return;
				}
				mainCanvasChildren.detach();
				
				startPos = event.target.id.indexOf("_maximize");
				if (startPos < 0) {
					return;
				}
				var sideCanvasId = event.target.id.substring(0, startPos);

				var sideCanvas = $("#" + sideCanvasId + "_canvas");
				var sideCanvasChildren = sideCanvas.children("canvas");
				if (!sideCanvasChildren || sideCanvasChildren.length == 0) {
					return;
				}
				sideCanvasChildren.detach();
				
				// swap dimensions
				var sideCanvasRelativeCross = event.data[0].actualDataSet.planes[sideViewPlaneId].getRelativeCrossCoordinates(); 
				var mainCanvasRelativeCross = event.data[0].actualDataSet.planes[mainViewPlaneId].getRelativeCrossCoordinates();
				
				var sideCanvasDims = {x: sideCanvasChildren[0].width, y: sideCanvasChildren[0].height};
				var mainCanvasDims = {x: mainCanvasChildren[0].width, y: mainCanvasChildren[0].height};
				
				var tmpAttr = [];
				for (var i=0; i < sideCanvasChildren.length; i++) {
					tmpAttr[i] = sideCanvasChildren[i].getAttribute("class");
					sideCanvasChildren[i].setAttribute("class", mainCanvasChildren[i].getAttribute("class"));
					sideCanvasChildren[i].width = mainCanvasDims.x;
					sideCanvasChildren[i].height = mainCanvasDims.y;
				}
				event.data[0].actualDataSet.planes[sideViewPlaneId].setDimensions(mainCanvasDims.x, mainCanvasDims.y);
				// store zoom level for side view
				var zoomLevelSideView = event.data[0].actualDataSet.planes[sideViewPlaneId].getDataExtent().zoom_level;

				for (var i=0; i < mainCanvasChildren.length; i++) {
					mainCanvasChildren[i].setAttribute("class", tmpAttr[i]);
					mainCanvasChildren[i].width = sideCanvasDims.x;
					mainCanvasChildren[i].height = sideCanvasDims.y;
				}
				event.data[0].actualDataSet.planes[mainViewPlaneId].setDimensions(sideCanvasDims.x, sideCanvasDims.y);
								
				mainCanvas.append(sideCanvasChildren);
				sideCanvas.append(mainCanvasChildren);
				
				// remember change in class
				$("#" + sideCanvasId + "_maximize").addClass("canvas_" + mainViewPlaneId);
				$("#" + sideCanvasId  + "_maximize").removeClass("canvas_" + sideViewPlaneId);
				$("#dataset_" + (x+1) +"_main_view_canvas").addClass("canvas_" + sideViewPlaneId);
				$("#dataset_" + (x+1) +"_main_view_canvas").removeClass("canvas_" + mainViewPlaneId);
				$("#dataset_" + (x+1) + "_canvas_main_slider").addClass("canvas_" + sideViewPlaneId);
				$("#dataset_" + (x+1) + "_canvas_main_slider").removeClass("canvas_" + mainViewPlaneId);
				// swap slice dimension values
				$("#dataset_" + (x+1) + "_canvas_main_slider").attr("value", event.data[0].actualDataSet.planes[sideViewPlaneId].data_extent.slice);
				$("#dataset_" + (x+1) + "_canvas_main_slider").attr("max", event.data[0].actualDataSet.planes[sideViewPlaneId].data_extent.max_slices);
				
				// swap main view
				event.data[0].actualDataSet.planes[mainViewPlaneId].is_main_view = false;
				event.data[0].actualDataSet.planes[sideViewPlaneId].is_main_view = true;
				
				// redraw and change the zoom level as well
				var now = new Date().getTime();
				event.data[0].actualDataSet.planes[sideViewPlaneId].redrawWithCenterAndCrossAtGivenPixelCoordinates(sideCanvasRelativeCross, now);
				event.data[0].actualDataSet.planes[mainViewPlaneId].redrawWithCenterAndCrossAtGivenPixelCoordinates(mainCanvasRelativeCross, now);
				event.data[0].actualDataSet.planes[sideViewPlaneId].changeToZoomLevel(event.data[0].actualDataSet.planes[mainViewPlaneId].getDataExtent().zoom_level);
				event.data[0].actualDataSet.planes[mainViewPlaneId].changeToZoomLevel(zoomLevelSideView);
				event.data[0].actualDataSet.planes[sideViewPlaneId].updateExtentInfo(event.data[0].actualDataSet.planes[sideViewPlaneId].getDataExtent().getExtentCoordinates());
			});
		}	
	
		// Z PLANE AKA SLICE SLIDER 
		var extractCanvasId = function(sliderId, actualDataSet) {
			if (!sliderId) {
				return;
			}
			
			var planeId = null;
			/*
			if (TissueStack.phone) {
				return sliderId.substring("canvas_".length, "canvas_".length + 1);
			}
			*/
			var plane =
				TissueStack.Utils.returnFirstOccurranceOfPatternInStringArray($("#" + sliderId).attr("class").split(" "), "^canvas_");
			if (!plane) {
				return;
			}

			var startPos = "canvas_".length;
			planeId = plane.substring(startPos, startPos + 1);

			var dataset_prefixEnd = sliderId.lastIndexOf("_canvas_main_slider");
			if (dataset_prefixEnd > 0 && sliderId.substring(0,dataset_prefixEnd) != actualDataSet.planes[planeId].dataset_id) {
				return null;
			}
			
			return planeId;
		};
		var triggerQueuedRedraw = function(id, slice, actualDataSet) {
			if (!id) {
				return;
			}
			
			slice = parseInt(slice);
			
			if (slice < 0) slice = 0;
			else if (slice > actualDataSet.planes[id].data_extent.max_slices) slice = actualDataSet.planes[id].data_extent.max_slices;
			
			actualDataSet.planes[id].events.updateCoordinateDisplay();
			actualDataSet.planes[id].events.changeSliceForPlane(slice);			
		};
		
		(function(actualDataSet, x) {
			// z dimension slider: set proper length and min/max for dimension
			// sadly a separate routine is necessary for the active page slider.
			// for reasons unknown the active page slider does not refresh until after a page change has been performed 
			if ((TissueStack.desktop || TissueStack.tablet)) {
				$('.ui-slider-vertical').css({"height": TissueStack.canvasDimensions.height - 50});
			} 
			$(TissueStack.phone ? ('.canvasslider') : ('#dataset_' + (x+1) + '_canvas_main_slider')).each(
				function() {
					var id = extractCanvasId(this.id, actualDataSet);
					
					if (!id) {
						return;
					}
					
					$(this).attr("min", 0);
					$(this).attr("max", actualDataSet.planes[id].data_extent.max_slices);
					$(this).attr("value", actualDataSet.planes[id].data_extent.slice);
					$(this).blur();
				}
			);
			// avoid potential double binding by un-binding at this stage
			$(TissueStack.phone ? ('.canvasslider') : ('#dataset_' + (x+1) + '_canvas_main_slider')).unbind("change");
			// rebind
			$(TissueStack.phone ? ('.canvasslider') : ('#dataset_' + (x+1) + '_canvas_main_slider')).bind ("change", function (event, ui)  {
				var id = extractCanvasId(this.id, actualDataSet);
				if (!id) {
					return;
				}
	
				triggerQueuedRedraw(id, this.value, actualDataSet);
			});
	
			// rebind
			if (TissueStack.phone) {
				// avoid potential double binding by un-binding at this stage
                $('.canvasslider').die("slidercreate");			
				// rebind
				$('.canvasslider').live ("slidercreate", function () {
					var res = $('#' + this.id).data('events');
					// unbind previous change
					$('#' + this.id).unbind("change");
					if (!res.change || res.change.length == 0) {
						$('#' + this.id).bind("change", function (event, ui)  {
							var id = extractCanvasId(this.id);
							if (!id) {
								return;
							}
							triggerQueuedRedraw(id, this.value, actualDataSet);
						});
					}
				});
			}
		})(dataSet, y);
	}
};

TissueStack.applyUserParameters = function() {
	var initOpts = TissueStack.configuration['initOpts'];

	if (!initOpts) return;
	
	var plane_id = typeof(initOpts['plane']) === 'string' ?  initOpts['plane'] : 'y';
	var dataSet = (typeof(TissueStack.dataSetNavigation.selectedDataSets.dataset_1) === 'string' 
						&& TissueStack.dataSetNavigation.selectedDataSets.dataset_1.length > 0) ?
								TissueStack.dataSetStore.getDataSetById(TissueStack.dataSetNavigation.selectedDataSets.dataset_1)
								:null;
								
    // plane or data set does not exist => good bye
	if (!dataSet || !dataSet.planes[plane_id]) return;
	
	// do we need to swap planes in the main view
	var maximizeIcon = $("#dataset_1 .canvas_" + plane_id + ",maximize_view_icon");
	if (maximizeIcon && maximizeIcon.length == 1) {
		// not elegant but fire event to achieve our plane swap
		maximizeIcon.click();
	}
	
	var plane = dataSet.planes[plane_id];
	
	setTimeout(function() {
		if (initOpts['zoom'] != null && initOpts['zoom'] >= 0 && initOpts['zoom'] < plane.data_extent.zoom_levels.length) {
			plane.changeToZoomLevel(initOpts['zoom']); 
		}

		var givenCoords = {};
		if (initOpts['x'] != null || initOpts['y'] != null || initOpts['z'] != null) {
			givenCoords = {x: initOpts['x'] != null ? initOpts['x'] : 0,
					y: initOpts['y'] != null ? initOpts['y'] : 0,
					z: initOpts['z'] != null ? initOpts['z'] : 0};
			
			if (plane.getDataExtent().worldCoordinatesTransformationMatrix) {
				givenCoords = plane.getDataExtent().getPixelForWorldCoordinates(givenCoords);
			}
		} else {
			givenCoords = plane.getRelativeCrossCoordinates();
			givenCoords.z = plane.getDataExtent().slice;
		}
		plane.redrawWithCenterAndCrossAtGivenPixelCoordinates(givenCoords);

		var slider = TissueStack.phone ? 
				$("#canvas_" + plane.data_extent.plane + "_slider") :
				$("#" + (plane.dataset_id == "" ? "" : plane.dataset_id + "_") + "canvas_main_slider");
		if (slider) {
			slider.attr("value", givenCoords.z);
			 if (!TissueStack.phone) slider.slider("refresh");
		};

		// erase initial opts
		TissueStack.configuration['initOpts'] = null;
	}, 100);
};

$(document).ready(function() {
	if (!TissueStack.Utils.supportsCanvas()) {
		alert("Your browser does not support the HTML5 feature 'Canvas'!\n\n" +
				"This means that this site will be of very limited use for you.\n\n" +
				"We recommend upgrading your browser: Latest versions of Chrome, Firefox, Safari and Opera support the canvas element," +
				" so does IE from version 9 on.");
	}
	  // override cross domain behavior
	  var options = {
		  allowCrossDomainPages : true
	  };
	  // override form submission behavior for desktop version
	  if (TissueStack.desktop) {
		  options.ajaxEnabled = false;
	  }
	  
	  $.extend(  $.mobile , options);

	var afterLoadingRoutine = function() {
		// create an instance of the navigation
		TissueStack.dataSetNavigation = new TissueStack.DataSetNavigation();
		
		// see if we have received initial values for data set incl. coords and zoom level
		var initOpts = TissueStack.Utils.readQueryStringFromAddressBar();
		if (initOpts) TissueStack.configuration['initOpts'] = initOpts;
		
		// display the first data set received from the backend list unless a particular was requested or the requested one does not exist
		if (TissueStack.configuration['initOpts'] && TissueStack.configuration['initOpts']['ds'] 
				&& TissueStack.dataSetStore.getDataSetById('localhost_' + TissueStack.configuration['initOpts']['ds'])) {
			if (TissueStack.desktop)
				TissueStack.dataSetNavigation.getDynaTreeObject().selectKey("localhost_" + TissueStack.configuration['initOpts']['ds']);
			else
				TissueStack.dataSetNavigation.addDataSet(TissueStack.dataSetStore.getDataSetById('localhost_' + TissueStack.configuration['initOpts']['ds']).id, 0);
		} else {
			var ds = TissueStack.dataSetStore.getDataSetByIndex(0);
			if (TissueStack.desktop) TissueStack.dataSetNavigation.getDynaTreeObject().selectKey(ds.id); 
			else TissueStack.dataSetNavigation.addDataSet(ds.id, 0);
		}
		TissueStack.dataSetNavigation.showDataSet(1);
		
		// initialize ui and events
		if (!TissueStack.desktop) { // avoid double binding
			TissueStack.InitUserInterface();
			TissueStack.BindDataSetDependentEvents();
		}
		TissueStack.BindGlobalEvents();
		if (TissueStack.configuration['initOpts']) TissueStack.applyUserParameters();

		// add admin functionality to all versions
		TissueStack.admin = new TissueStack.Admin();
	};
	// call asynchronous init
	TissueStack.Init(afterLoadingRoutine);

});