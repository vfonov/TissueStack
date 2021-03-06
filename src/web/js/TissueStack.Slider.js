/*
 * This file is part of TissueStack.
 *
 * TissueStack is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * TissueStack is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TissueStack.  If not, see <http://www.gnu.org/licenses/>.
 */
( function( $, undefined ) {

$.widget( "mobile.slider", $.mobile.widget, {
	options: {
		theme: null,
		trackTheme: null,
		disabled: false,
		initSelector: "input[type='range'], :jqmData(type='range'), :jqmData(role='slider')"
	},

	_create: function() {

		var self = this,

			control = this.element,

			parentTheme = control.parents( "[class*='ui-bar-'],[class*='ui-body-']" ).eq( 0 ),

			parentTheme = parentTheme.length ? parentTheme.attr( "class" ).match( /ui-(bar|body)-([a-z])/ )[ 2 ] : "c",

			theme = this.options.theme ? this.options.theme : parentTheme,

			trackTheme = this.options.trackTheme ? this.options.trackTheme : parentTheme,
			
			cType = control[ 0 ].nodeName.toLowerCase(),

			selectClass = ( cType == "select" ) ? "ui-slider-switch" : "",

			controlID = control.attr( "id" ),

			labelID = controlID + "-label",

			label = $( "[for='"+ controlID +"']" ).attr( "id", labelID ),

			val = function() {
				return  cType == "input"  ? parseFloat( control.val() ) : control[0].selectedIndex;
			},

			min =  cType == "input" ? parseFloat( control.attr( "min" ) ) : 0,

			max =  cType == "input" ? parseFloat( control.attr( "max" ) ) : control.find( "option" ).length-1,

			//set up orientation style ( overwrite for vertical version)
			
			Orientation = control.attr( "orientation"),
			
			step = window.parseFloat( control.attr( "step" ) || 1 ),
			
			slider = $( "<div class='ui-slider-" + Orientation + " " + selectClass + " ui-btn-down-" + trackTheme +
									" ui-btn-corner-all' role='application'></div>" ),
			
			handle = $( "<a href='#' class='ui-slider-handle-"+Orientation +"'></a>" )
				.appendTo( slider )
				.buttonMarkup({ corners: true, theme: theme, shadow: true })
				.attr({
					"role": "slider",
					"aria-valuemin": min,
					"aria-valuemax": max,
					"aria-valuenow": val(),
					"aria-valuetext": val(),
					"title": val(),
					"aria-labelledby": labelID
				}),
			options;
						
		$.extend( this, {
			slider: slider,
			handle: handle,
			dragging: false,
			beforeStart: null
		});

		if ( cType == "select" ) {

			slider.wrapInner( "<div class='ui-slider-inneroffset'></div>" );

			options = control.find( "option" );

			control.find( "option" ).each(function( i ) {

				var side = !i ? "b":"a",
					corners = !i ? "right" :"left",
					theme = !i ? " ui-btn-down-" + trackTheme :" ui-btn-active";

				$( "<div class='ui-slider-labelbg ui-slider-labelbg-" + side + theme + " ui-btn-corner-" + corners + "'></div>" )
					.prependTo( slider );

				$( "<span class='ui-slider-label ui-slider-label-" + side + theme + " ui-btn-corner-" + corners + "' role='img'>" + $( this ).text() + "</span>" )
					.prependTo( handle );
			});

		}

		label.addClass( "ui-slider" );

		// monitor the input for updated values
		control.addClass( cType === "input" ? "ui-slider-input" : "ui-slider-switch" )
			.change( function() {
				self.refresh( val(), true );
			})
			.keyup( function() { // necessary?
				self.refresh( val(), true, true );
			})
			.blur( function() {
				self.refresh( val(), true );
			});

		// prevent screen drag when slider activated
		$( document ).bind( "vmousemove", function( event ) {
			if ( self.dragging ) {
				self.refresh( event );
				return false;
			}
		});

		slider.bind( "vmousedown", function( event ) {
			self.dragging = true;

			if ( cType === "select" ) {
				self.beforeStart = control[0].selectedIndex;
			}
			self.refresh( event );
			return false;
		});

		slider.add( document )
			.bind( "vmouseup", function() {
				if ( self.dragging ) {

					self.dragging = false;

					if ( cType === "select" ) {

						if ( self.beforeStart === control[ 0 ].selectedIndex ) {
							//tap occurred, but value didn't change. flip it!
							self.refresh( !self.beforeStart ? 1 : 0 );
						}
						var curval = val();
						var snapped = Math.round( curval / ( max - min ) * 100 );
						handle
							.addClass( "ui-slider-handle-snapping" )
							.css( "top", snapped + "%" )
							.animationComplete( function() {
								handle.removeClass( "ui-slider-handle-snapping" );
							});
					}
					return false;
				}
			});

		slider.insertAfter( control );

		// force focus on handle
		this.handle
			.bind( "vmousedown", function() {
				$( this ).focus();
			})
			.bind( "vclick", false );

		this.handle
			.bind( "keydown", function( event ) {
				var index = val();

				if ( self.options.disabled ) {
					return;
				}

				// In all cases prevent the default and mark the handle as active
				switch ( event.keyCode ) {
				 case $.mobile.keyCode.HOME:
				 case $.mobile.keyCode.END:
				 case $.mobile.keyCode.PAGE_UP:
				 case $.mobile.keyCode.PAGE_DOWN:
				 case $.mobile.keyCode.UP:
				 case $.mobile.keyCode.RIGHT:
				 case $.mobile.keyCode.DOWN:
				 case $.mobile.keyCode.LEFT:
					event.preventDefault();

					if ( !self._keySliding ) {
						self._keySliding = true;
						$( this ).addClass( "ui-state-active" );
					}
					break;
				}

				// move the slider according to the keypress
				switch ( event.keyCode ) {
				 case $.mobile.keyCode.HOME:
					self.refresh( min );
					break;
				 case $.mobile.keyCode.END:
					self.refresh( max );
					break;
				 case $.mobile.keyCode.PAGE_UP:
				 case $.mobile.keyCode.UP:
				 case $.mobile.keyCode.RIGHT:
					self.refresh( index + step );
					break;
				 case $.mobile.keyCode.PAGE_DOWN:
				 case $.mobile.keyCode.DOWN:
				 case $.mobile.keyCode.LEFT:
					self.refresh( index - step );
					break;
				}
			}) // remove active mark
			.keyup( function( event ) {
				if ( self._keySliding ) {
					self._keySliding = false;
					$( this ).removeClass( "ui-state-active" );
				}
			});

		this.refresh(undefined, undefined, true);
	},

	refresh: function( val, isfromControl, preventInputUpdate ) {
		if ( this.options.disabled ) { return; }

		var control = this.element, percent,
			cType = control[0].nodeName.toLowerCase(),
			min = cType === "input" ? parseFloat( control.attr( "min" ) ) : 0,
			max = cType === "input" ? parseFloat( control.attr( "max" ) ) : control.find( "option" ).length - 1;
			Orientation = control.attr( "orientation");
			
		if ( typeof val === "object" ) {
			var data = val,
				// a slight tolerance helped get to the ends of the slider
				tol = 8;
				
			if (Orientation == "vertical" && (!this.dragging || data.pageY < this.slider.offset().top - tol || data.pageY > this.slider.offset().top + this.slider.height() + tol )) {
				return;
			}

			if (Orientation == "horizontal" && (!this.dragging || data.pageX < this.slider.offset().left - tol || data.pageX > this.slider.offset().left + this.slider.width() + tol )) {
				return;
			}

		// apply to Vertical view 	
	
			if(Orientation == "vertical")
			{
				percent = Math.round( ( ( data.pageY - this.slider.offset().top ) / this.slider.height() ) * 10000 ) / 100;
			} else {
				percent = Math.round( ( ( data.pageX - this.slider.offset().left ) / this.slider.width() ) * 10000 ) / 100;
			}				
		
			
		} else {
			if ( val == null ) {
				val = cType === "input" ? parseFloat( control.val() ) : control[0].selectedIndex;
			}
			percent = ( parseFloat( val ) - min ) / ( max - min ) * 100;
		}

		if ( isNaN( percent ) ) {
			return;
		}

		if ( percent < 0 ) {
			percent = 0;
		}

		if ( percent > 100 ) {
			percent = 100;
		}

		var newval = Math.round( ( percent / 100 ) * ( max - min ) ) + min;

		if ( newval < min ) {
			newval = min;
		}

		if ( newval > max ) {
			newval = max;
		}
		
		if(Orientation == "vertical")
		{
			this.handle.css( "top", "" + Math.round(percent) + "%");
		} else {
			this.handle.css( "left", "" + Math.round(percent) + "%");
		}		

		
		this.handle.attr( {
				"aria-valuenow": cType === "input" ? newval : control.find( "option" ).eq( newval ).attr( "value" ),
				"aria-valuetext": cType === "input" ? newval : control.find( "option" ).eq( newval ).text(),
				title: newval
			});

		// add/remove classes for flip toggle switch
		if ( cType === "select" ) {
			if ( newval === 0 ) {
				this.slider.addClass( "ui-slider-switch-a" )
					.removeClass( "ui-slider-switch-b" );
			} else {
				this.slider.addClass( "ui-slider-switch-b" )
					.removeClass( "ui-slider-switch-a" );
			}
		}

		if ( !preventInputUpdate ) {
			// update control"s value
			if ( cType === "input" ) {
				control.val( newval );
			} else {
				control[ 0 ].selectedIndex = newval;
			}
			if ( !isfromControl ) {
				control.trigger( "change" );
			}
		}
	},

	enable: function() {
		this.element.attr( "disabled", false );
		this.slider.removeClass( "ui-disabled" ).attr( "aria-disabled", false );
		return this._setOption( "disabled", false );
	},

	disable: function() {
		this.element.attr( "disabled", true );
		this.slider.addClass( "ui-disabled" ).attr( "aria-disabled", true );
		return this._setOption( "disabled", true );
	}

});

//auto self-init widgets
$( document ).bind( "pagecreate create", function( e ){

	$( $.mobile.slider.prototype.options.initSelector, e.target )
		.not( ":jqmData(role='none'), :jqmData(role='nojs')" )
		.slider();
});


})( jQuery );