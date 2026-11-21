/**
 * Script injected into the Xbox Cloud Gaming page. It adds a virtual gamepad
 * (fed by the on-screen controls) and forwards real gamepad rumble to the
 * native app so the phone can vibrate.
 */
export const BRIDGE_JS = `
(function () {
  if (window.__xcpBridgeInstalled) return;
  window.__xcpBridgeInstalled = true;

  function post(payload) {
    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    } catch (error) {}
  }

  var BUTTON_COUNT = 17;
  var buttons = [];
  for (var i = 0; i < BUTTON_COUNT; i++) {
    buttons.push({ pressed: false, touched: false, value: 0 });
  }
  var axes = [0, 0, 0, 0];

  var virtualPad = {
    id: 'XCloud Play Virtual Gamepad (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
    index: 3,
    connected: true,
    mapping: 'standard',
    timestamp: 0,
    axes: axes,
    buttons: buttons,
    vibrationActuator: {
      type: 'dual-rumble',
      playEffect: function () { return Promise.resolve('complete'); },
      reset: function () { return Promise.resolve('complete'); }
    },
    hapticActuators: []
  };

  window.__xcpPad = {
    setButton: function (index, pressed, value) {
      var button = buttons[index];
      if (!button) return;
      var isPressed = !!pressed;
      button.pressed = isPressed;
      button.touched = isPressed;
      button.value = typeof value === 'number' ? value : (isPressed ? 1 : 0);
      virtualPad.timestamp = (window.performance && performance.now()) || Date.now();
    },
    setAxis: function (index, value) {
      if (index < 0 || index >= axes.length) return;
      axes[index] = Math.max(-1, Math.min(1, Number(value) || 0));
      virtualPad.timestamp = (window.performance && performance.now()) || Date.now();
    }
  };

  var nativeGetGamepads = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : null;

  function wrap(pad) {
    if (!pad) return pad;
    try {
      var actuator = pad.vibrationActuator;
      return {
        id: pad.id,
        index: pad.index,
        connected: pad.connected,
        mapping: pad.mapping,
        timestamp: pad.timestamp,
        axes: pad.axes,
        buttons: pad.buttons,
        hapticActuators: pad.hapticActuators,
        vibrationActuator: actuator
          ? {
              type: actuator.type || 'dual-rumble',
              playEffect: function (type, params) {
                var duration = 120;
                var intensity = 1;
                if (params) {
                  duration = params.duration || params.durationMs || duration;
                  intensity = params.strongMagnitude || params.weakMagnitude || 1;
                }
                post({ type: 'haptic', duration: duration, intensity: intensity });
                try {
                  return actuator.playEffect(type, params);
                } catch (error) {
                  return Promise.resolve('complete');
                }
              },
              reset: function () {
                post({ type: 'haptic', duration: 0, intensity: 0 });
                try {
                  return actuator.reset();
                } catch (error) {
                  return Promise.resolve('complete');
                }
              }
            }
          : undefined
      };
    } catch (error) {
      return pad;
    }
  }

  if (nativeGetGamepads) {
    navigator.getGamepads = function () {
      var native = nativeGetGamepads() || [];
      var list = [null, null, null, virtualPad];
      if (native[0]) list[0] = wrap(native[0]);
      if (native[1]) list[1] = wrap(native[1]);
      if (native.length > 0) list[2] = native[2] ? wrap(native[2]) : null;
      return list;
    };
  }

  function announcePad() {
    try {
      var event;
      try {
        event = new GamepadEvent('gamepadconnected', { gamepad: virtualPad });
      } catch (error) {
        event = new Event('gamepadconnected');
        try {
          Object.defineProperty(event, 'gamepad', { value: virtualPad });
        } catch (defineError) {}
      }
      window.dispatchEvent(event);
    } catch (error) {}
  }

  announcePad();
  var announcements = 0;
  var announceTimer = setInterval(function () {
    announcements += 1;
    announcePad();
    if (announcements > 12) clearInterval(announceTimer);
  }, 2000);

  window.__xcpZoom = function (percent) {
    try {
      document.documentElement.style.zoom = String((Number(percent) || 100) / 100);
      var viewport = document.querySelector('meta[name=viewport]');
      if (viewport && !viewport.dataset.xcp) {
        viewport.dataset.xcp = '1';
        viewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        );
      }
    } catch (error) {}
  };

  window.__xcpGoHome = function () {
    window.location.href = 'https://play.xbox.com/';
  };

  window.__xcpFullscreen = function () {
    try {
      var element = document.documentElement;
      if (element.requestFullscreen) element.requestFullscreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
    } catch (error) {}
  };

  post({ type: 'ready', url: window.location.href });
})();
true;
`;
