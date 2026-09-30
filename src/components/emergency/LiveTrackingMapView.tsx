import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';

const MAP_HEIGHT = 380;

export interface LiveTrackingMapViewProps {
  driverLat: number;
  driverLng: number;
  driverHeading?: number;
  driverSpeed?: number;
  patientLat: number;
  patientLng: number;
  patientName?: string;
  patientAddress?: string;
  emergencyType?: string;
  priority?: string;
  routeProgress?: number; // 0 to 100
  etaMinutes?: number;
  distanceKm?: number;
  onSimulateStep?: () => void;
  onSimulateArrival?: () => void;
  onSimulatePatientShift?: () => void;
  onSimulateTraffic?: () => void;
  onResetRoute?: () => void;
}

const buildLeafletHtml = (
  driverLat: number,
  driverLng: number,
  patientLat: number,
  patientLng: number,
  patientName: string,
  patientAddress: string
): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #0f172a;
      overflow: hidden;
    }
    #map {
      width: 100%;
      height: 100%;
      background: #0f172a;
    }
    .leaflet-container {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .driver-pin-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .driver-badge-icon {
      font-size: 28px;
      line-height: 28px;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.6));
      animation: pulse-siren 1.5s infinite;
    }
    .driver-pill-label {
      background: #0284c7;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #38bdf8;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      white-space: nowrap;
      margin-top: -2px;
      letter-spacing: 0.5px;
    }
    .patient-pin-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .patient-badge-icon {
      font-size: 30px;
      line-height: 30px;
      filter: drop-shadow(0 3px 8px rgba(220,38,38,0.7));
      animation: bounce 1.8s infinite;
    }
    .patient-pill-label {
      background: #dc2626;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #f87171;
      box-shadow: 0 2px 5px rgba(0,0,0,0.4);
      white-space: nowrap;
      margin-top: -4px;
      letter-spacing: 0.5px;
    }
    @keyframes pulse-siren {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.12); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    .leaflet-control-attribution {
      font-size: 9px !important;
      background: rgba(15, 23, 42, 0.8) !important;
      color: #94a3b8 !important;
      padding: 2px 6px !important;
    }
    .leaflet-control-attribution a {
      color: #38bdf8 !important;
      text-decoration: none;
    }
    .leaflet-bar a {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border-bottom: 1px solid #334155 !important;
    }
    .leaflet-bar a:hover {
      background-color: #334155 !important;
    }
    .custom-map-popup .leaflet-popup-content-wrapper {
      background: #1e293b;
      color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #334155;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .custom-map-popup .leaflet-popup-tip {
      background: #1e293b;
    }
  </style>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""
  ></script>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var driverMarker = null;
    var patientMarker = null;
    var routePolyline = null;

    var curDLat = ${driverLat};
    var curDLng = ${driverLng};
    var curPLat = ${patientLat};
    var curPLng = ${patientLng};
    var pName = ${JSON.stringify(patientName)};
    var pAddr = ${JSON.stringify(patientAddress)};

    function initMap() {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 150);
        return;
      }
      try {
        map = L.map('map', {
          zoomControl: true,
          attributionControl: true
        });

        // Real OpenStreetMap Tile Service Layer with mandatory attribution
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Driver Marker (🚑 Driver)
        var driverIcon = L.divIcon({
          className: 'custom-driver-icon',
          html: '<div class="driver-pin-wrap"><div class="driver-badge-icon">🚑</div><div class="driver-pill-label">DRIVER</div></div>',
          iconSize: [52, 44],
          iconAnchor: [26, 22]
        });

        driverMarker = L.marker([curDLat, curDLng], { icon: driverIcon }).addTo(map);
        driverMarker.bindPopup('<div style="font-size:12px; line-height: 16px;"><b>🚑 RapidRescue Ambulance</b><br><span style="color:#38bdf8;">Officer En Route</span></div>', { className: 'custom-map-popup' });

        // Patient / Pickup Marker (📍 Patient / Pickup)
        var patientIcon = L.divIcon({
          className: 'custom-patient-icon',
          html: '<div class="patient-pin-wrap"><div class="patient-badge-icon">📍</div><div class="patient-pill-label">PATIENT / PICKUP</div></div>',
          iconSize: [64, 48],
          iconAnchor: [32, 42]
        });

        patientMarker = L.marker([curPLat, curPLng], { icon: patientIcon }).addTo(map);
        patientMarker.bindPopup('<div style="font-size:12px; line-height: 16px;"><b>📍 Pickup Location</b><br><b>' + pName + '</b><br><span style="color:#94a3b8;">' + pAddr + '</span></div>', { className: 'custom-map-popup' });

        // Visual Route / Path between driver and patient
        routePolyline = L.polyline([[curDLat, curDLng], [curPLat, curPLng]], {
          color: '#0284c7',
          weight: 5,
          opacity: 0.9,
          dashArray: '6, 8',
          lineJoin: 'round'
        }).addTo(map);

        fitRouteBounds();
      } catch (err) {
        console.error('Leaflet initialization error:', err);
      }
    }

    function fitRouteBounds() {
      if (!map || !driverMarker || !patientMarker) return;
      var bounds = L.latLngBounds([
        driverMarker.getLatLng(),
        patientMarker.getLatLng()
      ]);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
    }

    function centerAmbulance() {
      if (!map || !driverMarker) return;
      map.setView(driverMarker.getLatLng(), 16);
    }

    function centerPatient() {
      if (!map || !patientMarker) return;
      map.setView(patientMarker.getLatLng(), 16);
    }

    window.fitRouteBounds = fitRouteBounds;
    window.centerAmbulance = centerAmbulance;
    window.centerPatient = centerPatient;

    window.updateLocations = function(dLat, dLng, pLat, pLng, shouldFit) {
      if (dLat && dLng && driverMarker) {
        driverMarker.setLatLng([dLat, dLng]);
      }
      if (pLat && pLng && patientMarker) {
        patientMarker.setLatLng([pLat, pLng]);
      }
      if (routePolyline && driverMarker && patientMarker) {
        routePolyline.setLatLngs([
          driverMarker.getLatLng(),
          patientMarker.getLatLng()
        ]);
      }
      if (shouldFit) {
        fitRouteBounds();
      }
    };

    function handleMessage(event) {
      try {
        var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (msg.action === 'UPDATE') {
          window.updateLocations(msg.driverLat, msg.driverLng, msg.patientLat, msg.patientLng, msg.shouldFit);
        } else if (msg.action === 'FIT_BOUNDS') {
          fitRouteBounds();
        } else if (msg.action === 'CENTER_AMBULANCE') {
          centerAmbulance();
        } else if (msg.action === 'CENTER_PATIENT') {
          centerPatient();
        }
      } catch (e) {}
    }

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initMap();
    } else {
      document.addEventListener('DOMContentLoaded', initMap);
    }
  </script>
</body>
</html>
`;

export const LiveTrackingMapView: React.FC<LiveTrackingMapViewProps> = ({
  driverLat,
  driverLng,
  driverHeading = 45,
  driverSpeed = 48,
  patientLat,
  patientLng,
  patientName = 'Emergency Patient',
  patientAddress = '124 5th Cross Road, Ward 4',
  emergencyType = 'MEDICAL EMERGENCY',
  priority = 'CRITICAL',
  routeProgress = 25,
  etaMinutes = 6,
  distanceKm = 3.2,
  onSimulateStep,
  onSimulateArrival,
  onSimulatePatientShift,
  onSimulateTraffic,
  onResetRoute,
}) => {
  const [viewFocus, setViewFocus] = useState<'FIT_ROUTE' | 'AMBULANCE' | 'PATIENT'>('FIT_ROUTE');
  const [showDevControls, setShowDevControls] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Dynamic progress calculations
  const progressClamped = Math.min(100, Math.max(0, routeProgress));
  const isArrived = progressClamped >= 98;

  // Compute effective driver coordinates:
  // If routeProgress is simulated between 0 and 100, interpolate along the path
  const effectiveDriverLat =
    routeProgress !== undefined && routeProgress > 0 && routeProgress < 100
      ? driverLat + (patientLat - driverLat) * (routeProgress / 100)
      : routeProgress >= 100
      ? patientLat
      : driverLat;

  const effectiveDriverLng =
    routeProgress !== undefined && routeProgress > 0 && routeProgress < 100
      ? driverLng + (patientLng - driverLng) * (routeProgress / 100)
      : routeProgress >= 100
      ? patientLng
      : driverLng;

  // Remaining telemetry calculations
  const dynamicDistance = (distanceKm * (1 - progressClamped / 100)).toFixed(1);
  const dynamicEta = Math.max(1, Math.round(etaMinutes * (1 - progressClamped / 100)));

  // Generate initial HTML once to prevent WebView unmounts and reloads
  const initialHtmlRef = useRef<string>(
    buildLeafletHtml(
      effectiveDriverLat,
      effectiveDriverLng,
      patientLat,
      patientLng,
      patientName,
      patientAddress
    )
  );

  // Live marker updates via injectJavaScript / postMessage without reloading the WebView
  useEffect(() => {
    if (!isMapLoaded) return;

    const script = `
      if (typeof window.updateLocations === 'function') {
        window.updateLocations(${effectiveDriverLat}, ${effectiveDriverLng}, ${patientLat}, ${patientLng}, false);
      }
      true;
    `;

    if (Platform.OS === 'web') {
      try {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            action: 'UPDATE',
            driverLat: effectiveDriverLat,
            driverLng: effectiveDriverLng,
            patientLat,
            patientLng,
            shouldFit: false,
          }),
          '*'
        );
      } catch {
        // Fallback
      }
    } else {
      webViewRef.current?.injectJavaScript(script);
    }
  }, [effectiveDriverLat, effectiveDriverLng, patientLat, patientLng, isMapLoaded]);

  const handleFitRoute = () => {
    setViewFocus('FIT_ROUTE');
    const script = `
      if (typeof window.fitRouteBounds === 'function') {
        window.fitRouteBounds();
      }
      true;
    `;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ action: 'FIT_BOUNDS' }),
        '*'
      );
    } else {
      webViewRef.current?.injectJavaScript(script);
    }
  };

  const handleCenterAmbulance = () => {
    setViewFocus('AMBULANCE');
    const script = `
      if (typeof window.centerAmbulance === 'function') {
        window.centerAmbulance();
      }
      true;
    `;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ action: 'CENTER_AMBULANCE' }),
        '*'
      );
    } else {
      webViewRef.current?.injectJavaScript(script);
    }
  };

  const handleCenterPatient = () => {
    setViewFocus('PATIENT');
    const script = `
      if (typeof window.centerPatient === 'function') {
        window.centerPatient();
      }
      true;
    `;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ action: 'CENTER_PATIENT' }),
        '*'
      );
    } else {
      webViewRef.current?.injectJavaScript(script);
    }
  };

  return (
    <View style={styles.container}>
      {/* Turn-by-Turn Instruction Banner */}
      <View style={[styles.turnBanner, isArrived && styles.turnBannerArrived]}>
        <View style={styles.turnIconBox}>
          <Text style={styles.turnIcon}>{isArrived ? '🏁' : '⬆'}</Text>
        </View>
        <View style={styles.turnTextBox}>
          <Text style={styles.turnTitle}>
            {isArrived ? 'ARRIVED AT PICKUP LOCATION' : 'PROCEED STRAIGHT ON HOSPITAL ROAD'}
          </Text>
          <Text style={styles.turnSubtitle}>
            {isArrived
              ? 'Prepare patient triage & stabilization equipment'
              : `In 450m, prepare to turn right toward ${patientAddress}`}
          </Text>
        </View>
        <View style={styles.turnEtaBox}>
          <Text style={styles.turnEtaValue}>{isArrived ? '0' : dynamicEta}m</Text>
          <Text style={styles.turnEtaLabel}>ETA</Text>
        </View>
      </View>

      {/* Real OpenStreetMap Map Canvas via Leaflet & WebView */}
      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          <iframe
            ref={iframeRef}
            srcDoc={initialHtmlRef.current}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#0F172A',
            }}
            onLoad={() => {
              setIsMapLoaded(true);
              handleFitRoute();
            }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: initialHtmlRef.current }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            bounces={false}
            scalesPageToFit={false}
            onLoadEnd={() => {
              setIsMapLoaded(true);
              handleFitRoute();
            }}
          />
        )}

        {/* Top-Left Telemetry HUD Box */}
        <View style={styles.hudBox} pointerEvents="none">
          <View style={styles.hudRow}>
            <Text style={styles.hudDot}>●</Text>
            <Text style={styles.hudLiveText}>LIVE OPENSTREETMAP GPS</Text>
          </View>
          <Text style={styles.hudCoords}>
            {effectiveDriverLat.toFixed(4)}°N, {effectiveDriverLng.toFixed(4)}°E
          </Text>
          <Text style={styles.hudHeading}>HDG {driverHeading}° • SPD {driverSpeed} KM/H</Text>
        </View>

        {/* Map View Controls (Recenter: Fit Route, Ambulance, Patient) */}
        <View style={styles.mapControlsCol}>
          <TouchableOpacity
            style={[styles.mapCtrlBtn, viewFocus === 'FIT_ROUTE' && styles.mapCtrlBtnActive]}
            onPress={handleFitRoute}
            activeOpacity={0.8}
            accessibilityLabel="Fit entire route"
          >
            <Text style={styles.mapCtrlIcon}>🗺️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapCtrlBtn, viewFocus === 'AMBULANCE' && styles.mapCtrlBtnActive]}
            onPress={handleCenterAmbulance}
            activeOpacity={0.8}
            accessibilityLabel="Center on ambulance"
          >
            <Text style={styles.mapCtrlIcon}>🚑</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapCtrlBtn, viewFocus === 'PATIENT' && styles.mapCtrlBtnActive]}
            onPress={handleCenterPatient}
            activeOpacity={0.8}
            accessibilityLabel="Center on patient pickup"
          >
            <Text style={styles.mapCtrlIcon}>📍</Text>
          </TouchableOpacity>
        </View>

        {/* Live Trip Progress Bar across Bottom of Map */}
        <View style={styles.mapProgressBarTrack} pointerEvents="none">
          <View style={[styles.mapProgressBarFill, { width: `${progressClamped}%` }]} />
        </View>
      </View>

      {/* Live Route Telemetry Dashboard Bar */}
      <View style={styles.telemetryBar}>
        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>REMAINING DISTANCE</Text>
          <Text style={styles.telemetryValue}>{isArrived ? '0.0' : dynamicDistance} km</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>ESTIMATED ARRIVAL</Text>
          <Text style={[styles.telemetryValue, styles.telemetryEtaValue]}>
            {isArrived ? 'ARRIVED' : `${dynamicEta} MIN`}
          </Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <Text style={styles.telemetryLabel}>ROUTE PROGRESS</Text>
          <Text style={styles.telemetryValue}>{Math.round(progressClamped)}%</Text>
        </View>
      </View>

      {/* DEV DEMO SIMULATOR MODEL SECTION */}
      <View style={styles.devDemoWrapper}>
        <TouchableOpacity
          style={styles.devDemoHeaderBtn}
          onPress={() => setShowDevControls(!showDevControls)}
          activeOpacity={0.7}
        >
          <View style={styles.devDemoHeaderLeft}>
            <Text style={styles.devDemoBolt}>⚡</Text>
            <Text style={styles.devDemoTitle}>DEV DEMO MODEL: GPS & ROUTE SIMULATOR</Text>
          </View>
          <Text style={styles.devDemoArrow}>{showDevControls ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showDevControls && (
          <View style={styles.devDemoPanel}>
            <Text style={styles.devDemoExplanation}>
              Simulate real-time driver movement, live GPS telemetry progression, and WebSocket dispatch events:
            </Text>

            <View style={styles.devButtonsGrid}>
              <TouchableOpacity
                style={[styles.devActionBtn, styles.devActionDrive]}
                onPress={onSimulateStep}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>🚗 Drive Forward (+15%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devActionBtn, styles.devActionArrive]}
                onPress={onSimulateArrival}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>🏁 Rapid Arrival (100%)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devActionBtn, styles.devActionShift]}
                onPress={onSimulatePatientShift}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>📍 Shift Patient GPS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.devActionBtn, styles.devActionTraffic]}
                onPress={onSimulateTraffic}
                activeOpacity={0.7}
              >
                <Text style={styles.devBtnText}>🚦 Traffic Delay (+3m)</Text>
              </TouchableOpacity>
            </View>

            {onResetRoute && (
              <TouchableOpacity
                style={styles.devResetBtn}
                onPress={onResetRoute}
                activeOpacity={0.7}
              >
                <Text style={styles.devResetBtnText}>🔄 Reset Route to 0%</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: Spacing.base,
  },
  turnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  turnBannerArrived: {
    backgroundColor: '#064E3B',
  },
  turnIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  turnIcon: {
    fontSize: 18,
    color: '#38BDF8',
    fontWeight: '800',
  },
  turnTextBox: {
    flex: 1,
  },
  turnTitle: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  turnSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 14,
  },
  turnEtaBox: {
    alignItems: 'center',
    paddingLeft: Spacing.sm,
  },
  turnEtaValue: {
    ...Typography.title,
    color: '#38BDF8',
    fontWeight: '900',
    lineHeight: 20,
  },
  turnEtaLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },

  // Map Canvas
  mapCanvas: {
    height: MAP_HEIGHT,
    backgroundColor: '#0F172A',
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  // Telemetry HUD Box
  hudBox: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 10,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudDot: {
    fontSize: 8,
    color: '#10B981',
  },
  hudLiveText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hudCoords: {
    fontSize: 10,
    color: '#E2E8F0',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  hudHeading: {
    fontSize: 9,
    color: '#94A3B8',
    fontFamily: 'monospace',
  },

  // Map Controls
  mapControlsCol: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    gap: Spacing.xs,
    zIndex: 10,
  },
  mapCtrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  mapCtrlBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(2, 132, 199, 0.4)',
  },
  mapCtrlIcon: {
    fontSize: 16,
  },

  // Bottom Map Progress Track
  mapProgressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  mapProgressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
  },

  // Telemetry Bar
  telemetryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  telemetryItem: {
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  telemetryValue: {
    ...Typography.body,
    fontWeight: '800',
    color: Colors.text,
  },
  telemetryEtaValue: {
    color: Colors.primary,
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },

  // Dev Demo Controls Wrapper
  devDemoWrapper: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  devDemoHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F1F5F9',
  },
  devDemoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devDemoBolt: {
    fontSize: 16,
    color: '#D97706',
  },
  devDemoTitle: {
    ...Typography.caption,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  devDemoArrow: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '800',
  },
  devDemoPanel: {
    padding: Spacing.base,
    backgroundColor: '#F8FAFC',
    gap: Spacing.sm,
  },
  devDemoExplanation: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  devButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  devActionBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  devActionDrive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  devActionArrive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  devActionShift: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  devActionTraffic: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  devBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  devResetBtn: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  devResetBtnText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});
