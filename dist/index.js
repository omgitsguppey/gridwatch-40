"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '100kb' }));
var reports = [];
var OUTAGE_TYPE_LABELS = {
    full: 'Full outage',
    partial: 'Partial outage',
    flicker: 'Flickering',
};
var DESCRIPTION_LIMIT = 280;
var DEFAULT_MAP_CENTER = { lat: 39.8283, lng: -98.5795 };
var normalizeZip = function (value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return null;
    }
    var raw = String(value).trim();
    if (!/^[0-9]{5}$/.test(raw)) {
        return null;
    }
    return raw;
};
var normalizeOutageType = function (value) {
    if (typeof value !== 'string') {
        return null;
    }
    var normalized = value.trim().toLowerCase();
    if (normalized === 'full' || normalized === 'partial' || normalized === 'flicker') {
        return normalized;
    }
    return null;
};
var normalizeDescription = function (value) {
    if (typeof value !== 'string') {
        return null;
    }
    var trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.length > DESCRIPTION_LIMIT) {
        return trimmed.slice(0, DESCRIPTION_LIMIT);
    }
    return trimmed;
};
var parseReport = function (payload) {
    if (!payload || typeof payload !== 'object') {
        return { error: 'Invalid report payload.' };
    }
    var record = payload;
    var zipCode = normalizeZip(record.zipCode);
    if (!zipCode) {
        return { error: 'Zip code must be 5 digits.' };
    }
    var outageType = normalizeOutageType(record.outageType);
    if (!outageType) {
        return { error: 'Select a valid outage type.' };
    }
    var description = normalizeDescription(record.description);
    if (!description) {
        return { error: 'Describe the outage in a few words.' };
    }
    var report = {
        id: "report_".concat(Date.now(), "_").concat(Math.random().toString(16).slice(2)),
        zipCode: zipCode,
        outageType: outageType,
        description: description,
        reportedAt: new Date().toISOString(),
    };
    return { report: report };
};
var normalizeMapsApiKey = function (value) {
    if (typeof value !== 'string') {
        return null;
    }
    var trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    return trimmed;
};
var parseGeocodeResponse = function (payload) {
    if (!payload || typeof payload !== 'object') {
        return { error: 'Unexpected geocoding response.' };
    }
    var record = payload;
    if (record.status !== 'OK') {
        return { error: 'Unable to geocode that zip code.' };
    }
    if (!Array.isArray(record.results) || record.results.length === 0) {
        return { error: 'No geocoding results found.' };
    }
    var firstResult = record.results[0];
    if (!firstResult || typeof firstResult !== 'object') {
        return { error: 'Malformed geocoding results.' };
    }
    var geometry = firstResult.geometry;
    if (!geometry || typeof geometry !== 'object') {
        return { error: 'Missing geometry in geocoding response.' };
    }
    var location = geometry.location;
    if (!location || typeof location !== 'object') {
        return { error: 'Missing location in geocoding response.' };
    }
    var lat = typeof location.lat === 'number' ? location.lat : null;
    var lng = typeof location.lng === 'number' ? location.lng : null;
    if (lat === null || lng === null) {
        return { error: 'Invalid coordinates in geocoding response.' };
    }
    return { location: { lat: lat, lng: lng } };
};
var mapsBrowserKey = normalizeMapsApiKey(process.env.MAPS_BROWSER_API_KEY) ||
    normalizeMapsApiKey(process.env.MAPS_API_KEY);
var mapsServerKey = normalizeMapsApiKey(process.env.MAPS_SERVER_API_KEY) ||
    normalizeMapsApiKey(process.env.MAPS_API_KEY);
app.get('/', function (req, res) {
    res.type('html').send("<!doctype html>\n    <html lang=\"en\">\n      <head>\n        <meta charset=\"UTF-8\" />\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n        <title>GridWatch</title>\n        <style>\n          :root {\n            color-scheme: light;\n            font-family: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"SF Pro Display\", \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n            background: #f5f5f7;\n            color: #0b0b0f;\n          }\n\n          * {\n            box-sizing: border-box;\n            margin: 0;\n            padding: 0;\n          }\n\n          body {\n            background: linear-gradient(180deg, #f9f9fb 0%, #eef0f4 100%);\n            min-height: 100vh;\n          }\n\n          main {\n            display: flex;\n            flex-direction: column;\n            gap: 1.5rem;\n            padding: 2rem 1.5rem 4rem;\n            max-width: 720px;\n            margin: 0 auto;\n          }\n\n          header {\n            display: flex;\n            flex-direction: column;\n            gap: 0.75rem;\n          }\n\n          .badge {\n            align-self: flex-start;\n            font-size: 0.75rem;\n            font-weight: 600;\n            color: #1c4fd7;\n            background: #e0e9ff;\n            padding: 0.35rem 0.75rem;\n            border-radius: 999px;\n          }\n\n          h1 {\n            font-size: 2rem;\n            font-weight: 700;\n            letter-spacing: -0.03em;\n          }\n\n          p {\n            color: #4b4b59;\n            line-height: 1.5;\n          }\n\n          .card {\n            background: #ffffffcc;\n            border-radius: 24px;\n            padding: 1.5rem;\n            box-shadow: 0 18px 45px rgba(11, 11, 15, 0.08);\n            border: 1px solid rgba(255, 255, 255, 0.7);\n            backdrop-filter: blur(20px);\n          }\n\n          form {\n            display: flex;\n            flex-direction: column;\n            gap: 1rem;\n          }\n\n          label {\n            font-size: 0.9rem;\n            font-weight: 600;\n            color: #1b1b23;\n          }\n\n          input,\n          textarea,\n          select {\n            width: 100%;\n            border-radius: 16px;\n            border: 1px solid #d8dbe6;\n            padding: 0.85rem 1rem;\n            font-size: 1rem;\n            background: #ffffff;\n            color: #1b1b23;\n            transition: border-color 0.2s ease, box-shadow 0.2s ease;\n          }\n\n          input:focus,\n          textarea:focus,\n          select:focus {\n            outline: none;\n            border-color: #1c4fd7;\n            box-shadow: 0 0 0 4px rgba(28, 79, 215, 0.15);\n          }\n\n          textarea {\n            min-height: 110px;\n            resize: vertical;\n          }\n\n          .form-actions {\n            display: flex;\n            flex-direction: column;\n            gap: 0.75rem;\n          }\n\n          button {\n            border: none;\n            border-radius: 999px;\n            padding: 0.85rem 1.5rem;\n            font-size: 1rem;\n            font-weight: 600;\n            color: white;\n            background: linear-gradient(135deg, #1c4fd7, #2955ff);\n            box-shadow: 0 12px 24px rgba(28, 79, 215, 0.35);\n            cursor: pointer;\n            transition: transform 0.2s ease, box-shadow 0.2s ease;\n          }\n\n          button:hover {\n            transform: translateY(-1px);\n            box-shadow: 0 18px 32px rgba(28, 79, 215, 0.4);\n          }\n\n          .helper-text {\n            font-size: 0.85rem;\n            color: #65657a;\n          }\n\n          .status {\n            padding: 0.75rem 1rem;\n            border-radius: 14px;\n            font-size: 0.9rem;\n            font-weight: 500;\n          }\n\n          .status.error {\n            background: #ffe6e6;\n            color: #b42318;\n          }\n\n          .status.success {\n            background: #e6f4ea;\n            color: #1b7f3b;\n          }\n\n          .report-list {\n            display: flex;\n            flex-direction: column;\n            gap: 0.75rem;\n          }\n\n          .report-item {\n            border-radius: 18px;\n            padding: 0.85rem 1rem;\n            background: #f8f9ff;\n            border: 1px solid #e4e7f2;\n          }\n\n          .report-item h3 {\n            font-size: 1rem;\n            margin-bottom: 0.25rem;\n          }\n\n          .report-item span {\n            font-size: 0.85rem;\n            color: #5f5f73;\n          }\n\n          .map-shell {\n            display: flex;\n            flex-direction: column;\n            gap: 0.75rem;\n          }\n\n          .map {\n            width: 100%;\n            height: 320px;\n            border-radius: 20px;\n            border: 1px solid #e4e7f2;\n            background: #e9ecf5;\n          }\n\n          @media (min-width: 768px) {\n            main {\n              padding: 3rem 2rem 5rem;\n            }\n\n            h1 {\n              font-size: 2.5rem;\n            }\n\n            .form-actions {\n              flex-direction: row;\n              justify-content: space-between;\n              align-items: center;\n            }\n          }\n        </style>\n      </head>\n      <body>\n        <main>\n          <header>\n            <span class=\"badge\">Community powered</span>\n            <h1>Report power outages in seconds.</h1>\n            <p>GridWatch helps neighbors share outage status by zip code. Submit what you are seeing and keep your community informed.</p>\n          </header>\n\n          <section class=\"card\">\n            <form id=\"report-form\">\n              <div>\n                <label for=\"zip\">Zip code</label>\n                <input id=\"zip\" name=\"zip\" type=\"text\" inputmode=\"numeric\" autocomplete=\"postal-code\" placeholder=\"94103\" maxlength=\"5\" required />\n              </div>\n              <div>\n                <label for=\"outageType\">Outage type</label>\n                <select id=\"outageType\" name=\"outageType\" required>\n                  <option value=\"\">Select one</option>\n                  <option value=\"full\">Full outage</option>\n                  <option value=\"partial\">Partial outage</option>\n                  <option value=\"flicker\">Flickering</option>\n                </select>\n              </div>\n              <div>\n                <label for=\"description\">What are you experiencing?</label>\n                <textarea id=\"description\" name=\"description\" maxlength=\"".concat(DESCRIPTION_LIMIT, "\" placeholder=\"Power out since 3:15 PM, neighbors are affected.\" required></textarea>\n                <div class=\"helper-text\">Keep it short and helpful.</div>\n              </div>\n              <div class=\"form-actions\">\n                <button type=\"submit\">Submit report</button>\n                <span class=\"helper-text\">We only store the last 50 reports.</span>\n              </div>\n              <div id=\"status\" class=\"status\" hidden></div>\n            </form>\n          </section>\n\n          <section class=\"card\">\n            <h2>Recent reports</h2>\n            <p class=\"helper-text\">Live updates appear as neighbors submit them.</p>\n            <div id=\"report-list\" class=\"report-list\"></div>\n          </section>\n\n          <section class=\"card map-shell\">\n            <h2>Outage map</h2>\n            <p class=\"helper-text\">We center the map on the latest reported zip code to help neighbors visualize outages.</p>\n            <div id=\"map\" class=\"map\" role=\"presentation\"></div>\n            <div id=\"map-status\" class=\"status\" hidden></div>\n          </section>\n        </main>\n\n        <script>\n          const form = document.getElementById('report-form');\n          const status = document.getElementById('status');\n          const reportList = document.getElementById('report-list');\n          const mapStatus = document.getElementById('map-status');\n\n          const renderStatus = (message, tone) => {\n            status.textContent = message;\n            status.className = 'status ' + tone;\n            status.hidden = false;\n          };\n\n          const clearStatus = () => {\n            status.textContent = '';\n            status.className = 'status';\n            status.hidden = true;\n          };\n\n          const renderMapStatus = (message, tone) => {\n            mapStatus.textContent = message;\n            mapStatus.className = 'status ' + tone;\n            mapStatus.hidden = false;\n          };\n\n          const clearMapStatus = () => {\n            mapStatus.textContent = '';\n            mapStatus.className = 'status';\n            mapStatus.hidden = true;\n          };\n\n          const formatDate = (iso) => {\n            const date = new Date(iso);\n            if (Number.isNaN(date.getTime())) {\n              return 'Just now';\n            }\n            return date.toLocaleString(undefined, {\n              month: 'short',\n              day: 'numeric',\n              hour: 'numeric',\n              minute: '2-digit',\n            });\n          };\n\n          const renderReports = (items) => {\n            reportList.innerHTML = '';\n            if (!Array.isArray(items) || items.length === 0) {\n              reportList.innerHTML = '<div class=\"report-item\"><span>No reports yet. Be the first to help your area.</span></div>';\n              return;\n            }\n            items.forEach((report) => {\n              const wrapper = document.createElement('div');\n              wrapper.className = 'report-item';\n              wrapper.innerHTML = [\n                '<h3>',\n                (OUTAGE_TYPE_LABELS_PLACEHOLDER[report.outageType] || 'Outage'),\n                ' in ',\n                report.zipCode,\n                '</h3>',\n                '<p>',\n                report.description,\n                '</p>',\n                '<span>',\n                formatDate(report.reportedAt),\n                '</span>',\n              ].join('');\n              reportList.appendChild(wrapper);\n            });\n          };\n\n          const loadReports = async () => {\n            try {\n              const response = await fetch('/api/reports');\n              const data = await response.json();\n              renderReports(data.reports || []);\n            } catch (error) {\n              renderReports([]);\n            }\n          };\n\n          const MAPS_API_KEY = ").concat(JSON.stringify(mapsBrowserKey), ";\n          const DEFAULT_MAP_CENTER = ").concat(JSON.stringify(DEFAULT_MAP_CENTER), ";\n          let mapInstance = null;\n          let mapMarker = null;\n\n          const loadMapScript = () => new Promise((resolve, reject) => {\n            if (window.google && window.google.maps) {\n              resolve();\n              return;\n            }\n\n            const script = document.createElement('script');\n            script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(MAPS_API_KEY);\n            script.async = true;\n            script.defer = true;\n            script.onload = () => resolve();\n            script.onerror = () => reject(new Error('Unable to load the Google Maps script.'));\n            document.head.appendChild(script);\n          });\n\n          const ensureMap = (center) => {\n            if (mapInstance) {\n              mapInstance.setCenter(center);\n              mapInstance.setZoom(11);\n              return;\n            }\n\n            mapInstance = new google.maps.Map(document.getElementById('map'), {\n              center,\n              zoom: 5,\n              fullscreenControl: false,\n              mapTypeControl: false,\n              streetViewControl: false,\n            });\n          };\n\n          const updateMapMarker = (center) => {\n            if (!mapMarker) {\n              mapMarker = new google.maps.Marker({\n                position: center,\n                map: mapInstance,\n              });\n              return;\n            }\n\n            mapMarker.setPosition(center);\n          };\n\n          const updateMapForZip = async (zipCode) => {\n            if (!MAPS_API_KEY) {\n              renderMapStatus('Map key missing. Add MAPS_BROWSER_API_KEY to enable the map.', 'error');\n              return;\n            }\n\n            try {\n              const response = await fetch('/api/geocode?zip=' + encodeURIComponent(zipCode));\n              const data = await response.json();\n              if (!response.ok) {\n                renderMapStatus(data.error || 'Unable to update map.', 'error');\n                return;\n              }\n\n              clearMapStatus();\n              ensureMap(data.location);\n              updateMapMarker(data.location);\n            } catch (error) {\n              renderMapStatus('Network error while loading the map.', 'error');\n            }\n          };\n\n          const initializeMap = async () => {\n            if (!MAPS_API_KEY) {\n              renderMapStatus('Map key missing. Add MAPS_BROWSER_API_KEY to enable the map.', 'error');\n              return;\n            }\n\n            try {\n              await loadMapScript();\n              ensureMap(DEFAULT_MAP_CENTER);\n              clearMapStatus();\n            } catch (error) {\n              renderMapStatus('Map failed to load. Please try again later.', 'error');\n            }\n          };\n\n          form.addEventListener('submit', async (event) => {\n            event.preventDefault();\n            clearStatus();\n\n            const formData = new FormData(form);\n            const payload = {\n              zipCode: formData.get('zip'),\n              outageType: formData.get('outageType'),\n              description: formData.get('description'),\n            };\n\n            try {\n              const response = await fetch('/api/reports', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify(payload),\n              });\n              const data = await response.json();\n              if (!response.ok) {\n                renderStatus(data.error || 'Unable to save report.', 'error');\n                return;\n              }\n              renderStatus('Thanks for reporting. Stay safe!', 'success');\n              const submittedZip = payload.zipCode;\n              if (submittedZip) {\n                updateMapForZip(submittedZip);\n              }\n              form.reset();\n              renderReports(data.reports || []);\n            } catch (error) {\n              renderStatus('Network error. Please try again.', 'error');\n            }\n          });\n\n          const OUTAGE_TYPE_LABELS_PLACEHOLDER = ").concat(JSON.stringify(OUTAGE_TYPE_LABELS), ";\n          loadReports();\n          initializeMap();\n        </script>\n      </body>\n    </html>"));
});
app.get('/api/reports', function (req, res) {
    res.json({ reports: reports });
});
app.get('/api/geocode', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var rawZip, zipCode, url, response, data, _a, location_1, error, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!mapsServerKey) {
                    res.status(500).json({ error: 'Maps API key is not configured.' });
                    return [2 /*return*/];
                }
                rawZip = Array.isArray(req.query.zip) ? req.query.zip[0] : req.query.zip;
                zipCode = normalizeZip(rawZip);
                if (!zipCode) {
                    res.status(400).json({ error: 'Zip code must be 5 digits.' });
                    return [2 /*return*/];
                }
                url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
                url.searchParams.set('components', "postal_code:".concat(zipCode));
                url.searchParams.set('key', mapsServerKey);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, fetch(url.toString())];
            case 2:
                response = _b.sent();
                if (!response.ok) {
                    res.status(502).json({ error: 'Geocoding request failed.' });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, response.json()];
            case 3:
                data = _b.sent();
                _a = parseGeocodeResponse(data), location_1 = _a.location, error = _a.error;
                if (!location_1) {
                    res.status(422).json({ error: error || 'Unable to geocode zip.' });
                    return [2 /*return*/];
                }
                res.json({ zipCode: zipCode, location: location_1 });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                res.status(502).json({ error: 'Unable to reach the geocoding service.' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
app.post('/api/reports', function (req, res) {
    var _a = parseReport(req.body), report = _a.report, error = _a.error;
    if (!report) {
        res.status(400).json({ error: error || 'Unable to save report.' });
        return;
    }
    reports.unshift(report);
    if (reports.length > 50) {
        reports.pop();
    }
    res.status(201).json({ report: report, reports: reports });
});
var port = Number.parseInt(process.env.PORT || '3000', 10);
app.listen(port, function () {
    console.log("listening on port ".concat(port));
});
//# sourceMappingURL=index.js.map