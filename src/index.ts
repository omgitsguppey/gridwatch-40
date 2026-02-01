import express from 'express';

const app = express();
app.use(express.json({ limit: '100kb' }));

type OutageType = 'full' | 'partial' | 'flicker';

interface OutageReport {
  id: string;
  zipCode: string;
  outageType: OutageType;
  description: string;
  reportedAt: string;
}

interface ReportParseResult {
  report?: OutageReport;
  error?: string;
}

const reports: OutageReport[] = [];

const OUTAGE_TYPE_LABELS: Record<OutageType, string> = {
  full: 'Full outage',
  partial: 'Partial outage',
  flicker: 'Flickering',
};

const DESCRIPTION_LIMIT = 280;

const normalizeZip = (value: unknown): string | null => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  const raw = String(value).trim();
  if (!/^[0-9]{5}$/.test(raw)) {
    return null;
  }

  return raw;
};

const normalizeOutageType = (value: unknown): OutageType | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'full' || normalized === 'partial' || normalized === 'flicker') {
    return normalized;
  }

  return null;
};

const normalizeDescription = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length > DESCRIPTION_LIMIT) {
    return trimmed.slice(0, DESCRIPTION_LIMIT);
  }

  return trimmed;
};

const parseReport = (payload: unknown): ReportParseResult => {
  if (!payload || typeof payload !== 'object') {
    return { error: 'Invalid report payload.' };
  }

  const record = payload as Record<string, unknown>;
  const zipCode = normalizeZip(record.zipCode);
  if (!zipCode) {
    return { error: 'Zip code must be 5 digits.' };
  }

  const outageType = normalizeOutageType(record.outageType);
  if (!outageType) {
    return { error: 'Select a valid outage type.' };
  }

  const description = normalizeDescription(record.description);
  if (!description) {
    return { error: 'Describe the outage in a few words.' };
  }

  const report: OutageReport = {
    id: `report_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    zipCode,
    outageType,
    description,
    reportedAt: new Date().toISOString(),
  };

  return { report };
};

app.get('/', (req, res) => {
  res.type('html').send(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>GridWatch</title>
        <style>
          :root {
            color-scheme: light;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;
            background: #f5f5f7;
            color: #0b0b0f;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            background: linear-gradient(180deg, #f9f9fb 0%, #eef0f4 100%);
            min-height: 100vh;
          }

          main {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            padding: 2rem 1.5rem 4rem;
            max-width: 720px;
            margin: 0 auto;
          }

          header {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .badge {
            align-self: flex-start;
            font-size: 0.75rem;
            font-weight: 600;
            color: #1c4fd7;
            background: #e0e9ff;
            padding: 0.35rem 0.75rem;
            border-radius: 999px;
          }

          h1 {
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.03em;
          }

          p {
            color: #4b4b59;
            line-height: 1.5;
          }

          .card {
            background: #ffffffcc;
            border-radius: 24px;
            padding: 1.5rem;
            box-shadow: 0 18px 45px rgba(11, 11, 15, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
          }

          form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          label {
            font-size: 0.9rem;
            font-weight: 600;
            color: #1b1b23;
          }

          input,
          textarea,
          select {
            width: 100%;
            border-radius: 16px;
            border: 1px solid #d8dbe6;
            padding: 0.85rem 1rem;
            font-size: 1rem;
            background: #ffffff;
            color: #1b1b23;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          input:focus,
          textarea:focus,
          select:focus {
            outline: none;
            border-color: #1c4fd7;
            box-shadow: 0 0 0 4px rgba(28, 79, 215, 0.15);
          }

          textarea {
            min-height: 110px;
            resize: vertical;
          }

          .form-actions {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          button {
            border: none;
            border-radius: 999px;
            padding: 0.85rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            color: white;
            background: linear-gradient(135deg, #1c4fd7, #2955ff);
            box-shadow: 0 12px 24px rgba(28, 79, 215, 0.35);
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          button:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 32px rgba(28, 79, 215, 0.4);
          }

          .helper-text {
            font-size: 0.85rem;
            color: #65657a;
          }

          .status {
            padding: 0.75rem 1rem;
            border-radius: 14px;
            font-size: 0.9rem;
            font-weight: 500;
          }

          .status.error {
            background: #ffe6e6;
            color: #b42318;
          }

          .status.success {
            background: #e6f4ea;
            color: #1b7f3b;
          }

          .report-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .report-item {
            border-radius: 18px;
            padding: 0.85rem 1rem;
            background: #f8f9ff;
            border: 1px solid #e4e7f2;
          }

          .report-item h3 {
            font-size: 1rem;
            margin-bottom: 0.25rem;
          }

          .report-item span {
            font-size: 0.85rem;
            color: #5f5f73;
          }

          @media (min-width: 768px) {
            main {
              padding: 3rem 2rem 5rem;
            }

            h1 {
              font-size: 2.5rem;
            }

            .form-actions {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <span class="badge">Community powered</span>
            <h1>Report power outages in seconds.</h1>
            <p>GridWatch helps neighbors share outage status by zip code. Submit what you are seeing and keep your community informed.</p>
          </header>

          <section class="card">
            <form id="report-form">
              <div>
                <label for="zip">Zip code</label>
                <input id="zip" name="zip" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="94103" maxlength="5" required />
              </div>
              <div>
                <label for="outageType">Outage type</label>
                <select id="outageType" name="outageType" required>
                  <option value="">Select one</option>
                  <option value="full">Full outage</option>
                  <option value="partial">Partial outage</option>
                  <option value="flicker">Flickering</option>
                </select>
              </div>
              <div>
                <label for="description">What are you experiencing?</label>
                <textarea id="description" name="description" maxlength="${DESCRIPTION_LIMIT}" placeholder="Power out since 3:15 PM, neighbors are affected." required></textarea>
                <div class="helper-text">Keep it short and helpful.</div>
              </div>
              <div class="form-actions">
                <button type="submit">Submit report</button>
                <span class="helper-text">We only store the last 50 reports.</span>
              </div>
              <div id="status" class="status" hidden></div>
            </form>
          </section>

          <section class="card">
            <h2>Recent reports</h2>
            <p class="helper-text">Live updates appear as neighbors submit them.</p>
            <div id="report-list" class="report-list"></div>
          </section>
        </main>

        <script>
          const form = document.getElementById('report-form');
          const status = document.getElementById('status');
          const reportList = document.getElementById('report-list');

          const renderStatus = (message, tone) => {
            status.textContent = message;
            status.className = 'status ' + tone;
            status.hidden = false;
          };

          const clearStatus = () => {
            status.textContent = '';
            status.className = 'status';
            status.hidden = true;
          };

          const formatDate = (iso) => {
            const date = new Date(iso);
            if (Number.isNaN(date.getTime())) {
              return 'Just now';
            }
            return date.toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });
          };

          const renderReports = (items) => {
            reportList.innerHTML = '';
            if (!Array.isArray(items) || items.length === 0) {
              const emptyItem = document.createElement('div');
              emptyItem.className = 'report-item';
              const emptyText = document.createElement('span');
              emptyText.textContent = 'No reports yet. Be the first to help your area.';
              emptyItem.appendChild(emptyText);
              reportList.appendChild(emptyItem);
              return;
            }
            items.forEach((report) => {
              const wrapper = document.createElement('div');
              wrapper.className = 'report-item';
              const title = document.createElement('h3');
              const label = OUTAGE_TYPE_LABELS_PLACEHOLDER[report.outageType] || 'Outage';
              title.textContent = `${label} in ${report.zipCode}`;
              const description = document.createElement('p');
              description.textContent = report.description;
              const timestamp = document.createElement('span');
              timestamp.textContent = formatDate(report.reportedAt);
              wrapper.appendChild(title);
              wrapper.appendChild(description);
              wrapper.appendChild(timestamp);
              reportList.appendChild(wrapper);
            });
          };

          const loadReports = async () => {
            try {
              const response = await fetch('/api/reports');
              const data = await response.json();
              renderReports(data.reports || []);
            } catch (error) {
              renderReports([]);
            }
          };

          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearStatus();

            const formData = new FormData(form);
            const payload = {
              zipCode: formData.get('zip'),
              outageType: formData.get('outageType'),
              description: formData.get('description'),
            };

            try {
              const response = await fetch('/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const data = await response.json();
              if (!response.ok) {
                renderStatus(data.error || 'Unable to save report.', 'error');
                return;
              }
              renderStatus('Thanks for reporting. Stay safe!', 'success');
              form.reset();
              renderReports(data.reports || []);
            } catch (error) {
              renderStatus('Network error. Please try again.', 'error');
            }
          });

          const OUTAGE_TYPE_LABELS_PLACEHOLDER = ${JSON.stringify(OUTAGE_TYPE_LABELS)};
          loadReports();
        </script>
      </body>
    </html>`);
});

app.get('/api/reports', (req, res) => {
  res.json({ reports });
});

app.post('/api/reports', (req, res) => {
  const { report, error } = parseReport(req.body);
  if (!report) {
    res.status(400).json({ error: error || 'Unable to save report.' });
    return;
  }

  reports.unshift(report);
  if (reports.length > 50) {
    reports.pop();
  }

  res.status(201).json({ report, reports });
});

const port = Number.parseInt(process.env.PORT || '3000', 10);
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
